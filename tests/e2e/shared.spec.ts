import { expect, test } from '@playwright/test'
import type { Browser, Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { createService } from '../../api/src/service.js'

function store() {
  const rows = new Map()
  let version = 0
  return {
    async create(entity: { partitionKey: string; rowKey: string }) {
      const key = `${entity.partitionKey}/${entity.rowKey}`
      if (rows.has(key)) throw Object.assign(new Error('Conflict'), { statusCode: 409 })
      rows.set(key, { ...entity, etag: String(++version) })
    },
    async get(partition: string, row: string) { return rows.get(`${partition}/${row}`) ?? null },
    async replace(entity: { partitionKey: string; rowKey: string }, etag: string) {
      const key = `${entity.partitionKey}/${entity.rowKey}`
      if (rows.get(key)?.etag !== etag) throw Object.assign(new Error('Race'), { statusCode: 412 })
      rows.set(key, { ...entity, etag: String(++version) })
    },
    async *list(prefix: string) { for (const entity of rows.values()) if (entity.partitionKey.startsWith(prefix)) yield entity },
  }
}

async function setup(browser: Browser) {
  const service = createService(store())
  const html = (await readFile('dist/index.html', 'utf8')).replace(/<meta[^>]*name=["']?booth-api-url\b[^>]*>/,
    '<meta name="booth-api-url" content="https://scores.test/api/scoreboard">')
  let failUpload = false
  let failJoin = false
  let failRead = false
  async function device() {
    const context = await browser.newContext({ serviceWorkers: 'block' })
    await context.route('https://booth.test/**', (route) => route.fulfill({ contentType: 'text/html', body: html }))
    await context.route('https://scores.test/**', async (route) => {
      const request = route.request()
      const headers = { 'Access-Control-Allow-Origin': 'https://booth.test', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
      const players = request.url().endsWith('/players')
      if (players && failJoin) return route.fulfill({ status: 503, headers, json: { error: 'Test shared check-in unavailable.' } })
      if (!players && request.method() === 'POST' && failUpload) return route.abort('failed')
      if (request.method() === 'GET' && failRead) return route.fulfill({ status: 503, headers, json: { error: 'Test board unavailable.' } })
      try {
        const json = request.method() === 'GET' ? await service.list() : players
          ? await service.join(request.postDataJSON())
          : await service.submit(request.postDataJSON(), request.headers().authorization)
        await route.fulfill({ status: players ? 201 : 200, headers, json })
      } catch (error) {
        await route.fulfill({ status: error.status ?? 500, headers, json: { error: error.message } })
      }
    })
    const page = await context.newPage()
    await page.goto('https://booth.test/#/singlish')
    return { context, page }
  }
  return { device, service, setFailUpload: (value: boolean) => { failUpload = value },
    setFailJoin: (value: boolean) => { failJoin = value }, setFailRead: (value: boolean) => { failRead = value } }
}

async function play(page: Page, name: string) {
  await page.getByRole('button', { name: 'Find the boardroom match', exact: true }).click()
  await expect(page.getByText(/By joining, you share your nickname/)).toBeVisible()
  await page.getByLabel('Name or nickname (optional)').fill(name)
  await page.getByRole('button', { name: 'Join shared leaderboard', exact: true }).click()
  await page.getByRole('button', { name: 'Skip guide', exact: true }).click()
  await page.getByRole('button', { name: /^A The air-conditioning/ }).click()
}

test('simultaneous independent devices see the same names and rankings without sharing active players', async ({ browser }) => {
  const fixture = await setup(browser)
  const a = await fixture.device()
  const b = await fixture.device()
  await Promise.all([play(a.page, 'CloudChamp'), play(b.page, 'DataDino')])
  await expect.poll(async () => (await fixture.service.list()).results.length).toBe(2)
  for (const device of [a, b]) {
    await device.page.getByRole('link', { name: 'View leaderboard', exact: true }).click()
    await device.page.getByRole('button', { name: 'Refresh board', exact: true }).click()
    await expect(device.page.getByRole('cell', { name: 'CloudChamp', exact: true })).toBeVisible()
    await expect(device.page.getByRole('cell', { name: 'DataDino', exact: true })).toBeVisible()
  }
  await expect(a.page.locator('.player-session-button strong')).toHaveText('CloudChamp')
  await expect(b.page.locator('.player-session-button strong')).toHaveText('DataDino')
  await a.page.getByRole('button', { name: "Clear this device's scores", exact: true }).click()
  await a.page.getByRole('button', { name: 'Yes, clear local scores', exact: true }).click()
  expect((await fixture.service.list()).results).toHaveLength(2)
  await expect(a.page.getByRole('cell', { name: 'DataDino', exact: true })).toBeVisible()
  await a.context.close()
  await b.context.close()
})

test('failed uploads remain explicit and retry idempotently; offline reads do not invent an empty board', async ({ browser }) => {
  const fixture = await setup(browser)
  const { context, page } = await fixture.device()
  fixture.setFailUpload(true)
  await play(page, 'RetryPilot')
  await expect(page.getByText(/1 score upload.*awaiting confirmation/)).toBeVisible()
  expect((await fixture.service.list()).results).toHaveLength(0)
  fixture.setFailUpload(false)
  await page.getByRole('button', { name: 'Retry sync', exact: true }).click()
  await expect.poll(async () => (await fixture.service.list()).results.length).toBe(1)
  await expect(page.getByRole('button', { name: 'Retry sync', exact: true })).toHaveCount(0)
  await page.getByRole('link', { name: 'View leaderboard', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'RetryPilot', exact: true })).toBeVisible()
  fixture.setFailRead(true)
  await page.getByRole('button', { name: 'Refresh board', exact: true }).click()
  await expect(page.getByText(/Test board unavailable/)).toBeVisible()
  await expect(page.getByRole('cell', { name: 'RetryPilot', exact: true })).toBeVisible()
  await context.close()
})

test('shared check-in failure supports explicit local-only play and never uploads that identity', async ({ browser }) => {
  const fixture = await setup(browser)
  fixture.setFailJoin(true)
  const { context, page } = await fixture.device()
  await page.getByRole('button', { name: 'Find the boardroom match', exact: true }).click()
  await page.getByLabel('Name or nickname (optional)').fill('PrivatePilot')
  await page.getByRole('button', { name: 'Join shared leaderboard', exact: true }).click()
  await expect(page.getByText(/Shared check-in failed/)).toBeVisible()
  await page.getByRole('button', { name: 'Play on this device only', exact: true }).click()
  await page.getByRole('button', { name: 'Skip guide', exact: true }).click()
  await page.getByRole('button', { name: /^A The air-conditioning/ }).click()
  await expect(page.getByText(/This player chose local-only play/)).toBeVisible()
  expect((await fixture.service.list()).results).toHaveLength(0)
  await page.getByRole('link', { name: 'View leaderboard', exact: true }).click()
  await page.getByRole('button', { name: 'This device', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'PrivatePilot', exact: true })).toBeVisible()
  await context.close()
})

test('light is the default even on a dark device, with explicit dark override and toggle retained', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('./')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Use dark theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.goto('./?scoutTheme=dark')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.goto('./?scoutTheme=invalid')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('the connected shared board preserves the laptop start button and phone layout', async ({ browser }) => {
  const fixture = await setup(browser)
  const { page, context } = await fixture.device()
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto('https://booth.test/')
  await expect(page.getByText('Shared leaderboard connected', { exact: true })).toBeVisible()
  const start = await page.getByRole('button', { name: 'Open the case. Start the clock.' }).boundingBox()
  expect(start!.y + start!.height).toBeLessThan(768)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await context.close()
})
