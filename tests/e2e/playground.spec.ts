import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import jsQR from 'jsqr'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { challenges } from '../../src/data/challenges'
import { quizQuestions } from '../../src/data/quiz'
import { SCORE_KEY } from '../../src/lib/scores'

async function results(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]'), SCORE_KEY)
}

test('all four evidence cases can be won with genuine citations', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Beat the Agent', exact: true })).toBeVisible()
  for (const challenge of challenges) {
    await page.locator('.challenge-option').filter({ hasText: challenge.title }).click()
    await page.getByRole('button', { name: 'Open the case. Start the clock.' }).click()
    for (const id of challenge.correctIds) {
      await page.getByLabel(challenge.options.find((item) => item.id === id)!.label, { exact: true }).check()
    }
    for (const file of challenge.files) {
      const refs = challenge.requiredEvidence.filter((ref) => ref.startsWith(`${file.id}:`))
      if (!refs.length) continue
      await page.getByRole('tab', { name: file.title }).click()
      for (const ref of refs) await page.getByRole('checkbox', { name: `Cite ${ref}`, exact: true }).check()
    }
    await page.getByRole('button', { name: 'Lock in my answer' }).click()
    await expect(page.getByRole('heading', { name: 'Case cracked. Evidence and all.' })).toBeVisible()
    const ref = challenge.requiredEvidence[0]!
    await page.getByRole('button', { name: ref, exact: true }).click()
    await expect(page.locator(`[id="source-${ref}"]`)).toHaveClass('source-highlight')
    await expect(page.getByText('Not live AI', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Choose another case' }).click()
  }
  const saved = await results(page)
  expect(saved).toHaveLength(4)
  expect(saved.every((entry: { perfect: boolean; score: number }) => entry.perfect && entry.score === 100)).toBe(true)
  await page.reload()
  expect(await results(page)).toHaveLength(4)
})

test('timeouts save once, and leaving a game cancels its timer', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await page.getByRole('button', { name: 'Open the case. Start the clock.' }).click()
  await page.clock.fastForward(61_000)
  await expect(page.getByRole('heading', { name: 'Time up. Let the evidence talk.' })).toBeVisible()
  await page.clock.fastForward(60_000)
  expect(await results(page)).toHaveLength(1)
  await page.getByRole('button', { name: 'Choose another case' }).click()
  await page.getByRole('button', { name: 'Open the case. Start the clock.' }).click()
  await page.getByRole('navigation', { name: 'Games' }).getByRole('link', { name: 'AI or Aiyoh?' }).click()
  await expect(page.getByRole('heading', { name: 'AI or Aiyoh?', exact: true })).toBeVisible()
  await page.clock.fastForward(61_000)
  expect(await results(page)).toHaveLength(1)
})

test('quiz has eight scored claims, explanations and a replayable phone result', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./#/quiz')
  await page.getByRole('button', { name: "Let's play" }).click()
  for (const [index, question] of quizQuestions.entries()) {
    await expect(page.getByRole('heading', { name: question.claim })).toBeVisible()
    await page.getByRole('button', { name: question.correct ? 'Can! That checks out.' : 'Aiyoh! Not so fast.' }).click()
    await expect(page.getByText(question.explanation)).toBeVisible()
    await page.getByRole('button', { name: index === 7 ? 'Reveal my score' : 'Next claim' }).click()
  }
  await expect(page.getByRole('heading', { name: 'AI street-smart. Confirm can.' })).toBeVisible()
  expect((await results(page))[0]).toMatchObject({ game: 'quiz', score: 8, maxScore: 8 })
  await expect(page.getByText('Your score stays on this device. Nothing is synced to the laptop.')).toBeVisible()
  await page.getByRole('button', { name: 'Play again' }).click()
  await expect(page.getByRole('heading', { name: quizQuestions[0]!.claim })).toBeVisible()
})

test('spacebar and touch alarms work, and a healthy round rewards patience', async ({ page }) => {
  await page.clock.install()
  await page.goto('./#/drift')
  await page.getByRole('button', { name: 'Watch the sensor' }).click()
  await page.keyboard.press('Space')
  await expect(page.getByRole('heading', { name: 'That was a blip, not a drift.' })).toBeVisible()
  await page.getByRole('button', { name: 'Another round' }).click()
  await page.getByRole('button', { name: /Raise the alarm/ }).click()
  await expect(page.getByRole('heading', { name: 'That was a blip, not a drift.' })).toBeVisible()
  await page.getByRole('button', { name: 'Another round' }).click()
  await page.clock.fastForward(25_000)
  await expect(page.getByRole('heading', { name: 'The drift got away this time.' })).toBeVisible()
  await page.getByRole('button', { name: 'Another round' }).click()
  await page.clock.fastForward(25_000)
  await expect(page.getByRole('heading', { name: 'Steady nerves. Correct all-clear.' })).toBeVisible()
  expect((await results(page)).at(-1)).toMatchObject({ game: 'drift', score: 1000, perfect: true })
})

test('Singlish rewrites keep meaning and unmatched text does not get fake AI output', async ({ page }) => {
  await page.goto('./#/singlish')
  await page.getByRole('button', { name: 'Find the boardroom match' }).click()
  await page.getByRole('button', { name: /^A The air-conditioning/ }).click()
  await expect(page.getByRole('heading', { name: 'Professional. Faithful. Confirm can.' })).toBeVisible()
  expect((await results(page))[0]).toMatchObject({ game: 'singlish', score: 1 })
  expect(JSON.stringify(await results(page))).not.toContain('aircon not cold')
  await page.getByLabel('Your phrase / editable transcript').fill('A new fictional request not in the phrase bank')
  await page.getByRole('button', { name: 'Find the boardroom match' }).click()
  await expect(page.getByText(/No prepared rewrite matches/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Boardroom, not bored-room.' })).toHaveCount(0)
  await page.getByText('Try a genuinely live Copilot comparison').click()
  await expect(page.getByText(/No AI service is connected to this hub/)).toBeVisible()
})

test('voice is opt-in, transcripts are editable, and navigation aborts recognition', async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { speechAborts: 0 })
    class FakeRecognition {
      lang = ''
      continuous = false
      interimResults = false
      onresult: ((event: unknown) => void) | null = null
      onerror: ((event: unknown) => void) | null = null
      onend: (() => void) | null = null
      start() {
        this.onresult?.({ results: [{ isFinal: true, 0: { transcript: 'Eh, level 24 aircon not cold lah, can check?' } }] })
      }
      stop() { this.onend?.() }
      abort() { Reflect.set(window, 'speechAborts', Reflect.get(window, 'speechAborts') + 1) }
    }
    Object.assign(window, { SpeechRecognition: FakeRecognition })
  })
  await page.goto('./#/singlish')
  const start = page.getByRole('button', { name: 'Start voice input', exact: true })
  await expect(start).toBeDisabled()
  await page.getByRole('checkbox', { name: 'I understand and choose to use voice input.' }).check()
  await start.click()
  await expect(page.getByLabel('Your phrase / editable transcript')).toHaveValue('Eh, level 24 aircon not cold lah, can check?')
  await page.getByRole('navigation', { name: 'Games' }).getByRole('link', { name: 'AI or Aiyoh?' }).click()
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'speechAborts'))).toBeGreaterThan(0)
  expect(await results(page)).toHaveLength(0)
})

test('speech permission errors explicitly preserve preset play', async ({ page }) => {
  await page.addInitScript(() => {
    class DeniedRecognition {
      onerror: ((event: { error: string }) => void) | null = null
      onend: (() => void) | null = null
      start() { this.onerror?.({ error: 'not-allowed' }); this.onend?.() }
      abort() {}
    }
    Object.assign(window, { SpeechRecognition: DeniedRecognition })
  })
  await page.goto('./#/singlish')
  await page.getByRole('checkbox', { name: 'I understand and choose to use voice input.' }).check()
  await page.getByRole('button', { name: 'Start voice input', exact: true }).click()
  await expect(page.getByText(/Microphone permission was denied/)).toBeVisible()
  await page.getByRole('button', { name: 'Find the boardroom match' }).click()
  await expect(page.getByRole('heading', { name: 'Boardroom, not bored-room.' })).toBeVisible()
})

test('generated light and dark QR images decode to the exact quiz subpath', async ({ page }) => {
  for (const theme of ['light', 'dark']) {
    await page.goto(`./?scoutTheme=${theme}#/join`)
    await page.getByLabel('Public site URL').fill('https://example.test/ai-fun-day/')
    const image = page.getByRole('img', { name: /^QR code linking directly/ })
    await expect(image).toBeVisible()
    await image.evaluate((img: HTMLImageElement) => img.decode())
    const pixels = await image.evaluate((img: HTMLImageElement) => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const context = canvas.getContext('2d')!
      context.drawImage(img, 0, 0)
      return { data: Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data), width: canvas.width, height: canvas.height }
    })
    expect(jsQR(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height)?.data).toBe('https://example.test/ai-fun-day/#/quiz')
    await page.getByLabel('Public site URL').fill('http://localhost:5173/')
    await expect(page.locator('.qr-image')).toHaveCount(0)
    await expect(page.getByText(/No shareable URL yet/)).toBeVisible()
  }
})

test('warmed service-worker cache survives a fully offline reload', async ({ page, context }) => {
  await page.goto('./#/quiz')
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  await expect(page.getByText('Offline copy cached on this device', { exact: true })).toBeVisible()
  await expect(page.locator('.update-notice')).toHaveCount(0)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'AI or Aiyoh?', exact: true })).toBeVisible()
  for (const [route, heading] of [['drift', 'Spot the Drift'], ['singlish', 'Singlish to Boardroom'], ['beat', 'Beat the Agent']]) {
    await page.getByRole('navigation', { name: 'Games' }).getByRole('link', { name: heading }).click()
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    expect(page.url()).toContain(`#/${route}`)
  }
  await page.getByRole('button', { name: 'Open the case. Start the clock.' }).click()
  await page.getByRole('button', { name: 'Lock in my answer' }).click()
  await expect(page.getByText('PREPARED REFERENCE ANSWER', { exact: true })).toBeVisible()
})

test('standalone HTML cold-starts offline without a server or external requests', async ({ browser }) => {
  const context = await browser.newContext({ offline: true })
  const page = await context.newPage()
  const errors: string[] = []
  const external: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => { if (/^https?:/.test(request.url())) external.push(request.url()) })
  await page.goto(pathToFileURL(path.resolve('bundle.html')).href)
  await expect(page.getByRole('heading', { name: 'Beat the Agent', exact: true })).toBeVisible()
  for (const heading of ['Spot the Drift', 'AI or Aiyoh?', 'Singlish to Boardroom']) {
    await page.getByRole('navigation', { name: 'Games' }).getByRole('link', { name: heading }).click()
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Find the boardroom match' }).click()
  await page.getByRole('button', { name: /^A The air-conditioning/ }).click()
  expect(errors).toEqual([])
  expect(external).toEqual([])
  await context.close()
})

test('storage failures are visible and do not break a round', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage disabled') }
    Storage.prototype.setItem = () => { throw new Error('Storage disabled') }
  })
  await page.goto('./')
  await expect(page.getByText(/Browser storage is unavailable/)).toBeVisible()
  await page.getByRole('button', { name: 'Open the case. Start the clock.' }).click()
  await page.getByRole('button', { name: 'Lock in my answer' }).click()
  await expect(page.getByText(/Scores could not be saved in this browser/)).toBeVisible()
  await page.getByRole('link', { name: 'Local scores' }).click()
  await expect(page.getByText('Player 001')).toBeVisible()
})

test('desktop and mobile layouts have no overflow or serious accessibility violations', async ({ page }) => {
  test.setTimeout(60_000)
  const errors: string[] = []
  const issues: { route: string; theme: string; width: number; violations: unknown[] }[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 })
    for (const theme of ['light', 'dark']) {
    for (const route of ['beat', 'drift', 'quiz', 'singlish', 'home', 'join', 'host', 'scores']) {
      await page.goto(`./?scoutTheme=${theme}#/${route}`)
      await expect(page.locator('h1')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
      if (accessibility.violations.length) issues.push({
        route, theme, width,
        violations: accessibility.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => node.target) })),
      })
      if (['beat', 'quiz', 'singlish', 'home', 'join'].includes(route)) {
        await page.screenshot({ path: `test-results/${route}-${width}-${theme}.png`, fullPage: true })
      }
    }
    }
  }
  expect(errors).toEqual([])
  expect(issues).toEqual([])
})

test('the main start button fits a typical laptop without scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto('./')
  const button = page.getByRole('button', { name: 'Open the case. Start the clock.' })
  await expect(button).toBeVisible()
  const bounds = await button.boundingBox()
  expect(bounds!.y + bounds!.height).toBeLessThan(768)
})
