import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { GUIDE_STEP_MS } from '../../src/components/GameplayGuide'
import { SCORE_KEY } from '../../src/lib/scores'

async function savedCount(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]').length, SCORE_KEY)
}

async function checkIn(page: Page) {
  await page.getByLabel('Name or nickname (optional)').fill('GuidePilot')
  await page.getByRole('button', { name: 'Join the leaderboard', exact: true }).click()
}

test('the first animated guide waits for explicit play and does not spend the real clock', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await page.getByRole('button', { name: 'Open the case. Start the clock.' }).click()
  await checkIn(page)
  const guide = page.getByRole('dialog', { name: 'How to play: Beat the Agent', exact: true })
  await expect(guide).toHaveAttribute('data-step', '1')
  await expect(page.locator('.elapsed-clock')).toHaveCount(0)
  await page.clock.runFor(GUIDE_STEP_MS + 100)
  await expect(guide).toHaveAttribute('data-step', '2')
  await page.getByRole('button', { name: 'Pause demo', exact: true }).click()
  await page.clock.fastForward(120_000)
  await expect(guide).toHaveAttribute('data-step', '2')
  expect(await savedCount(page)).toBe(0)
  await page.getByRole('button', { name: 'Resume demo', exact: true }).click()
  await page.clock.runFor(GUIDE_STEP_MS + 100)
  await expect(guide).toHaveAttribute('data-step', '3')
  await page.clock.fastForward(120_000)
  await expect(guide).toBeVisible()
  expect(await savedCount(page)).toBe(0)
  await page.getByRole('button', { name: 'Replay', exact: true }).click()
  await expect(guide).toHaveAttribute('data-step', '1')
  await page.getByRole('button', { name: "Got it. Let's play!", exact: true }).click()
  await expect(page.locator('.elapsed-clock strong')).toHaveText('00:00')
  await expect(page.getByRole('button', { name: 'How to play', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Lock in my answer', exact: true }).click()
  expect(await savedCount(page)).toBe(1)
  await page.getByRole('button', { name: 'Choose another case', exact: true }).click()
  await page.getByRole('button', { name: 'Open the case. Start the clock.' }).click()
  await expect(page.locator('.elapsed-clock strong')).toHaveText('00:00')
  await expect(guide).toHaveCount(0)
})

test('guides are once per game for each new player, including the phone quiz route', async ({ page }) => {
  await page.goto('./#/quiz')
  await page.getByRole('button', { name: "Let's play", exact: true }).click()
  await checkIn(page)
  await expect(page.getByRole('dialog', { name: 'How to play: AI or Aiyoh?', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Skip guide', exact: true }).click()
  await expect(page.locator('.quiz-claim')).toBeVisible()
  await page.getByRole('navigation', { name: 'Games' }).getByRole('link', { name: 'Spot the Drift' }).click()
  await page.getByRole('button', { name: 'Watch the sensor', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'How to play: Spot the Drift', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.sensor-chart')).toHaveCount(0)
  await page.getByRole('button', { name: 'Watch the sensor', exact: true }).click()
  await page.getByRole('button', { name: 'Skip guide', exact: true }).click()
  await page.getByRole('button', { name: /Raise the alarm/ }).click()
  await page.getByRole('button', { name: 'Another round', exact: true }).click()
  await expect(page.locator('.sensor-chart')).toBeVisible()
  await expect(page.locator('.gameplay-guide')).toHaveCount(0)
  await page.getByRole('button', { name: /Raise the alarm/ }).click()
  await page.getByRole('button', { name: 'Next player', exact: true }).click()
  await checkIn(page)
  await page.getByRole('button', { name: 'Watch the sensor', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'How to play: Spot the Drift', exact: true })).toBeVisible()
})

test('preview, close, navigation and replay never trigger a stale pending round', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  const help = page.getByRole('button', { name: 'How to play', exact: true })
  await help.click()
  await expect(page.getByRole('dialog', { name: 'How to play: Beat the Agent', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Got it. Back to game.', exact: true }).click()
  await expect(page.locator('.elapsed-clock')).toHaveCount(0)
  await expect(help).toBeFocused()
  await page.getByRole('button', { name: 'Open the case. Start the clock.' }).click()
  await checkIn(page)
  await page.getByRole('button', { name: 'Close gameplay guide', exact: true }).click()
  await expect(page.locator('.elapsed-clock')).toHaveCount(0)
  await page.getByRole('button', { name: 'Open the case. Start the clock.' }).click()
  await page.evaluate(() => { location.hash = '/singlish' })
  await expect(page.getByRole('heading', { name: 'Singlish to Boardroom', exact: true })).toBeVisible()
  await expect(page.locator('.gameplay-guide')).toHaveCount(0)
  await page.clock.fastForward(120_000)
  expect(await savedCount(page)).toBe(0)
  await page.getByRole('button', { name: 'Find the boardroom match', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'How to play: Singlish to Boardroom', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Skip guide', exact: true }).click()
  await expect(page.locator('.rewrite-panel')).toBeFocused()
  await page.getByRole('button', { name: /^A The air-conditioning/ }).click()
  expect(await savedCount(page)).toBe(1)
  await help.click()
  await page.getByRole('button', { name: 'Replay', exact: true }).click()
  await page.getByRole('button', { name: 'Skip guide', exact: true }).click()
  expect(await savedCount(page)).toBe(1)
  await expect(page.getByRole('heading', { name: 'Professional. Faithful. Confirm can.' })).toBeVisible()
})

test('reduced motion uses manual steps without animation or automatic advancement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install()
  await page.goto('./#/drift')
  await page.getByRole('button', { name: 'How to play', exact: true }).click()
  const guide = page.locator('.gameplay-guide')
  await expect(guide).toHaveAttribute('data-step', '1')
  await expect(page.getByText('Reduced motion is on.', { exact: false })).toBeVisible()
  await page.clock.fastForward(30_000)
  await expect(guide).toHaveAttribute('data-step', '1')
  expect(await page.locator('.demo-trace').evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
  await page.getByRole('button', { name: 'Next step', exact: true }).click()
  await expect(guide).toHaveAttribute('data-step', '2')
  expect(await page.locator('.demo-trace').evaluate((element) => getComputedStyle(element).strokeDashoffset)).toBe('0px')
  await page.getByRole('button', { name: 'Next step', exact: true }).click()
  await expect(guide).toHaveAttribute('data-step', '3')
  await page.getByRole('button', { name: 'Replay', exact: true }).click()
  await page.clock.fastForward(30_000)
  await expect(guide).toHaveAttribute('data-step', '1')
  expect(await savedCount(page)).toBe(0)
})

test('all guide frames are readable on phones and accessible in both themes', async ({ page }) => {
  test.setTimeout(60_000)
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 })
    for (const theme of ['light', 'dark']) {
      for (const game of ['beat', 'drift', 'quiz', 'singlish']) {
        await page.goto(`./?scoutTheme=${theme}#/${game}`)
        await page.getByRole('button', { name: 'How to play', exact: true }).click()
        const guide = page.locator('.gameplay-guide')
        await expect(guide).toBeVisible()
        for (const step of [1, 2, 3]) {
          await page.getByRole('button', { name: new RegExp(`^Step ${step}:`) }).click()
          await expect(guide).toHaveAttribute('data-step', String(step))
          expect(await guide.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
        }
        const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
        expect(audit.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) }))).toEqual([])
        await page.screenshot({ path: `test-results/guide-${game}-${width}-${theme}.png`, fullPage: true })
        await page.keyboard.press('Escape')
        await expect(guide).toHaveCount(0)
      }
    }
  }
})

test('standalone guides work without network access or changes to local scores', async ({ browser }) => {
  const context = await browser.newContext({ offline: true })
  const page = await context.newPage()
  const network: string[] = []
  page.on('request', (request) => { if (/^https?:/.test(request.url())) network.push(request.url()) })
  await page.goto(pathToFileURL(path.resolve('bundle.html')).href + '#/quiz')
  await page.getByRole('button', { name: "Let's play", exact: true }).click()
  await checkIn(page)
  await expect(page.getByRole('dialog', { name: 'How to play: AI or Aiyoh?', exact: true })).toBeVisible()
  await page.getByRole('button', { name: /^Step 3:/ }).click()
  expect(await savedCount(page)).toBe(0)
  await page.getByRole('button', { name: "Got it. Let's play!", exact: true }).click()
  await expect(page.locator('.quiz-claim')).toBeVisible()
  expect(network).toEqual([])
  await context.close()
})
