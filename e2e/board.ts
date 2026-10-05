import type { Page } from '@playwright/test'

/**
 * Waits for the board to stop moving.
 *
 * The bubbles drift into place for a couple of seconds after a board is dealt.
 * Playwright will not click a moving element, so without this every test spends
 * its time retrying, and under parallel load some of them give up.
 */
export async function boardSettled(page: Page) {
  await page.locator('.graph[data-settled="true"]').waitFor({ timeout: 15_000 })
}

/**
 * Throws the saved game away while keeping the arrival card out of the way.
 *
 * Clearing everything also clears the key that holds that card back, and it
 * sits over the board — which is right for a player and wrong for a test about
 * something else. What the card does is pinned in greeting.spec.ts.
 */
export async function clearGame(page: Page) {
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('properties-game:skip-intro', 'true')
  })
}
