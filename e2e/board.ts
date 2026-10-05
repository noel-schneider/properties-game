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
 * Throws the saved game away without forgetting that this player has been here.
 *
 * Clearing everything also clears the flag that says the rules have been
 * shown, and the panel that greets a first arrival covers part of the board —
 * which is right for a player and wrong for a test that is about something
 * else. What that panel does is pinned in greeting.spec.ts.
 */
export async function clearGame(page: Page) {
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('properties-game:greeted', 'true')
  })
}
