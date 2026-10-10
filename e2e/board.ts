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
  await page.evaluate((board) => {
    localStorage.clear()
    localStorage.setItem('properties-game:skip-intro', 'true')
    // The board the game would deal is dealt at random, so a test that
    // reasons about what is on screen would reason about something different
    // on every run — which is how this suite started retrying. The game
    // restores a saved board before it deals one, so writing this is enough
    // to stand in front of the deal without the game knowing it is in a test.
    localStorage.setItem('properties-game:board', JSON.stringify(board))
  }, FIXED_BOARD)
}

/**
 * The board every test starts from.
 *
 * Thirteen concepts carrying nine categories between them, every one of them
 * easy to name, and the turtle in none of them so that there is always
 * something on screen that no answer uses. It was the game's own written
 * opening until the game started dealing instead: it taught a first-time
 * player that most trios answer to two names at once, which is a bad first
 * lesson and a perfectly good fixture.
 */
export const FIXED_BOARD = [
  'chocolate', 'honey', 'cake',
  'ant', 'bee', 'ladybug', 'turtle',
  'key', 'coin', 'watch',
  'snow', 'igloo', 'glacier',
]
