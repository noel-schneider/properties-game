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
