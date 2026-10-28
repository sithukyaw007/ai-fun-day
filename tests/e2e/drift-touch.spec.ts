import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { makeDriftRound, sensors } from '../../src/lib/drift'
import { SCORE_KEY } from '../../src/lib/scores'

test.use({ hasTouch: true, viewport: { width: 1280, height: 800 } })

async function saved(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]'), SCORE_KEY)
}

async function begin(page: Page, sensor: 'chiller' | 'co2' = 'chiller') {
  await page.goto('./#/drift')
  if (sensor === 'co2') await page.getByRole('button', { name: /Meeting Room 7 CO2 level/ }).tap()
  await page.getByRole('button', { name: 'Watch the sensor', exact: true }).tap()
  await page.getByRole('button', { name: 'Play as Guest 001 instead', exact: true }).tap()
  await page.getByRole('button', { name: 'Skip guide', exact: true }).tap()
  await expect(page.getByRole('button', { name: 'Raise the alarm', exact: true })).toBeVisible()
}

async function assertPadAndChartInView(page: Page) {
  const pad = page.getByRole('button', { name: 'Raise the alarm', exact: true })
  const bounds = await pad.boundingBox()
  expect(bounds!.height).toBeGreaterThanOrEqual(104)
  expect(bounds!.width).toBeGreaterThanOrEqual(260)
  expect(bounds!.y).toBeGreaterThanOrEqual(0)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height)
  const chart = await page.locator('.sensor-chart').boundingBox()
  expect(chart!.y).toBeGreaterThanOrEqual(0)
  expect(chart!.y + chart!.height).toBeLessThan(bounds!.y)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}

test('a Surface Go finger tap records one result without a keyboard or accidental replay', async ({ page }) => {
  await page.clock.install()
  await page.addInitScript(() => {
    Math.random = () => 0.000021
    Reflect.set(window, 'alarmPointerTypes', [])
    document.addEventListener('pointerup', (event) => {
      if ((event.target as Element).closest('.alarm-button')) Reflect.get(window, 'alarmPointerTypes').push(event.pointerType)
    })
  })
  await begin(page)
  await assertPadAndChartInView(page)
  await page.locator('.sensor-chart').tap()
  expect(await saved(page)).toHaveLength(0)
  const round = makeDriftRound(sensors[0]!, 21, false)
  await page.clock.runFor(round.onset! * 1000 + 100)
  const bounds = await page.getByRole('button', { name: 'Raise the alarm', exact: true }).boundingBox()
  await page.touchscreen.tap(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2)
  await expect(page.getByRole('heading', { name: 'You beat the simulated detector!', exact: true })).toBeVisible()
  expect(await page.evaluate(() => Reflect.get(window, 'alarmPointerTypes'))).toEqual(['touch'])
  const results = await saved(page)
  expect(results).toHaveLength(1)
  expect(results[0]).toMatchObject({ game: 'drift', variant: 'chiller', perfect: true })
  await page.touchscreen.tap(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2)
  await page.clock.fastForward(30_000)
  expect(await saved(page)).toHaveLength(1)
  await expect(page.getByRole('button', { name: 'Raise the alarm', exact: true })).toHaveCount(0)
})

test('both sensors support finger-only retry, false alarms and healthy all-clear rounds', async ({ page }) => {
  await page.clock.install()
  await begin(page, 'co2')
  await page.getByRole('button', { name: 'Raise the alarm', exact: true }).tap()
  await expect(page.getByRole('heading', { name: 'That was a blip, not a drift.', exact: true })).toBeVisible()
  for (let round = 2; round <= 4; round++) {
    await page.getByRole('button', { name: 'Another round', exact: true }).tap()
    await assertPadAndChartInView(page)
    if (round < 4) await page.getByRole('button', { name: 'Raise the alarm', exact: true }).tap()
    else await page.clock.fastForward(25_000)
  }
  await expect(page.getByRole('heading', { name: 'Steady nerves. Correct all-clear.', exact: true })).toBeVisible()
  expect((await saved(page)).at(-1)).toMatchObject({ game: 'drift', variant: 'co2', score: 1000 })
  await page.getByRole('button', { name: 'Change sensor', exact: true }).tap()
  await page.getByRole('button', { name: /Chiller CH-2 Approach temperature/ }).tap()
  await page.getByRole('button', { name: 'Watch the sensor', exact: true }).tap()
  await expect(page.getByRole('heading', { name: 'CH-2 chiller approach temperature', exact: true })).toBeVisible()
})

test('a swipe beginning on the alarm pad is not misinterpreted as a tap', async ({ page, context }) => {
  await page.clock.install()
  await begin(page)
  const pad = await page.getByRole('button', { name: 'Raise the alarm', exact: true }).boundingBox()
  const cdp = await context.newCDPSession(page)
  const x = pad!.x + pad!.width / 2
  const y = pad!.y + pad!.height / 2
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 120 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  expect(await saved(page)).toHaveLength(0)
  await expect(page.getByRole('button', { name: 'Raise the alarm', exact: true })).toBeVisible()
  await cdp.detach()
})

test('touch-capable tablets still support focused Enter and global spacebar shortcuts', async ({ page }) => {
  await page.clock.install()
  await begin(page)
  await page.getByRole('button', { name: 'Raise the alarm', exact: true }).focus()
  await page.keyboard.press('Enter')
  expect(await saved(page)).toHaveLength(1)
  await page.getByRole('button', { name: 'Another round', exact: true }).tap()
  await expect(page.getByRole('region', { name: 'Sensor chart and alarm controls', exact: true })).toBeFocused()
  await page.keyboard.press('Space')
  expect(await saved(page)).toHaveLength(2)
})

test('chart and finger pad stay visible in scaled Surface landscape and portrait viewports', async ({ page }) => {
  test.setTimeout(60_000)
  await page.clock.install()
  for (const viewport of [{ width: 1280, height: 800 }, { width: 960, height: 640 }, { width: 800, height: 1280 }]) {
    for (const theme of ['light', 'dark']) {
      await page.setViewportSize(viewport)
      await page.goto(`./?scoutTheme=${theme}#/drift`)
      await page.getByRole('button', { name: 'Watch the sensor', exact: true }).tap()
      await page.getByRole('button', { name: 'Play as Guest 001 instead', exact: true }).tap()
      await page.getByRole('button', { name: 'Skip guide', exact: true }).tap()
      await assertPadAndChartInView(page)
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
      expect(accessibility.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => node.target) }))).toEqual([])
      await page.screenshot({ path: `test-results/surface-drift-${viewport.width}-${theme}.png`, fullPage: false })
    }
  }
})
