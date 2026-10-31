import { devices, expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { boardSettled, clearGame } from './board'

// The phone's size, touch and pixel density, in the browser the rest of the
// suite runs in: what is being checked is the layout, not the engine.
const { defaultBrowserType: _engine, ...iPhone } = devices['iPhone 13']
test.use(iPhone)

type Box = { x: number; y: number; width: number; height: number }

const overlap = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

async function boxes(locator: Locator): Promise<Box[]> {
  const found: Box[] = []
  for (const one of await locator.all()) {
    const box = await one.boundingBox()
    if (box) found.push(box)
  }
  return found
}

async function apart(page: Page, a: string, b: string) {
  for (const one of await boxes(page.locator(a))) {
    for (const other of await boxes(page.locator(b))) {
      expect(overlap(one, other), `${a} lies over ${b}`).toBe(false)
    }
  }
}

/**
 * On a phone every corner of the screen is spoken for, and the pieces used to
 * be laid out for a desktop and left to fall where they fell: the score under
 * the controls, the achievements over the footer, the answer box over the
 * achievements.
 */
test('on a phone nothing lies over anything else', async ({ page }) => {
  await page.goto('/')
  await clearGame(page)
  // Cleared with the rest, and the dev tools cover the left of a board this
  // narrow.
  await page.evaluate(() => localStorage.setItem('properties-game:dev-panel', 'false'))
  await page.reload()
  await boardSettled(page)
  await page.evaluate(() => document.fonts.ready)

  // One group found, so the list of found categories is on screen too, then
  // three more picked, so the answer box is.
  for (const name of ['ant', 'bee', 'ladybug']) await page.locator(`.bubble[aria-label="${name}"]`).tap()
  await page.locator('.input').fill('insect')
  await page.getByRole('button', { name: 'Submit' }).tap()
  await expect(page.getByTestId('found')).toHaveText('1')
  for (const name of ['key', 'coin', 'watch']) await page.locator(`.bubble[aria-label="${name}"]`).tap()
  await expect(page.locator('.input')).toBeVisible()

  const top = '.corner--top-right > *'
  await apart(page, top, '.scoreboard__item')
  await apart(page, top, '.sheet')
  await apart(page, '.scoreboard__item', '.sheet')
  await apart(page, '.sound-note', '.scoreboard__item')
  await apart(page, '.sound-note', '.sheet')
  await apart(page, '.toast', '.input-container')
  await apart(page, '.input-container', '.corner--bottom-right > *')
  await apart(page, '.input-container', '.signature')
  await apart(page, '.corner--bottom-right > *', '.signature')

  // Everything inside the screen, across as well as down.
  const width = page.viewportSize()!.width
  for (const box of await boxes(page.locator(`${top}, .scoreboard__item, .input-container, .corner--bottom-right > *, .signature`))) {
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
  }

  // And no keyboard shortcut offered to a screen with no keyboard.
  await expect(page.locator('.press-enter-wrapper')).toBeHidden()
  if (process.env.PHONE_SHOT) {
    await expect(page.locator('.toast')).toHaveCount(0, { timeout: 20_000 })
    await page.screenshot({ path: process.env.PHONE_SHOT })
  }
})

/**
 * The tutorial's second lesson is a drag, and on a phone a drag is a finger:
 * touch events, not a mouse. Dropping a concept into a group is the only way
 * to do it, so a board that answered the mouse alone would leave a phone
 * player stuck on step two.
 */
test.describe('a first visit on a phone', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('is walked through both gestures with a finger', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('properties-game:dev-panel', 'false'))
    await page.reload()
    await boardSettled(page)

    for (const name of ['bee', 'ant', 'ladybug']) await page.locator(`.bubble[aria-label="${name}"]`).tap()
    await page.locator('.input').fill('insect')
    await page.getByRole('button', { name: 'Submit' }).tap()
    await expect(page.locator('.bubble[aria-label="butterfly"]')).toBeVisible()
    await boardSettled(page)

    const middle = async (names: string[]) => {
      const all = await Promise.all(names.map((name) => page.locator(`.bubble[aria-label="${name}"]`).boundingBox()))
      return {
        x: all.reduce((sum, b) => sum + b!.x + b!.width / 2, 0) / all.length,
        y: all.reduce((sum, b) => sum + b!.y + b!.height / 2, 0) / all.length,
      }
    }
    const touch = await page.context().newCDPSession(page)
    const send = (type: string, at?: { x: number; y: number }) =>
      touch.send('Input.dispatchTouchEvent', { type, touchPoints: at ? [at] : [] })

    // Eased towards the group, re-aimed every step: it drifts under a drag.
    let at = await middle(['butterfly'])
    await send('touchStart', at)
    for (let step = 0; step < 25; step++) {
      const target = await middle(['bee', 'ant', 'ladybug'])
      at = { x: at.x + (target.x - at.x) * 0.3, y: at.y + (target.y - at.y) * 0.3 }
      await send('touchMove', at)
      // A frame for the board to answer each move, as a finger gives it.
      await page.waitForTimeout(30)
    }
    if (process.env.PHONE_SHOT) await page.screenshot({ path: process.env.PHONE_SHOT })
    await send('touchEnd')

    await expect(page.getByRole('region', { name: 'Tutorial' })).toContainText('all you need to know')
  })
})
