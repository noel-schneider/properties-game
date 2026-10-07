import { defineConfig } from '@playwright/test'
import { BASE_URL, PORT } from './e2e/server'

export default defineConfig({
  testDir: './e2e',
  // Asks, before any test runs, whether the thing answering is actually this
  // game. See e2e/serves-the-game.ts.
  globalSetup: './e2e/serves-the-game.ts',
  use: {
    baseURL: BASE_URL,
    // The board drifts into place for a couple of seconds after every deal, and
    // Playwright will not click a moving element. Most of these tests are about
    // the game rather than the motion, so they run as a player who asked their
    // system for less animation would see it: laid out at once. The tests that
    // are about the motion opt back into it.
    reducedMotion: 'reduce',
    // These tests are about the board, and the card that greets every arrival
    // sits over it. They put it aside; what it does is pinned in its own spec,
    // which clears this.
    storageState: {
      cookies: [],
      origins: [{
        origin: BASE_URL,
        localStorage: [
          { name: 'properties-game:skip-intro', value: 'true' },
          // The dev tools are a column down the left edge, over that edge of
          // the board. These tests are about the game, and a click near the
          // left of the board would land on the tools instead.
          { name: 'properties-game:dev-panel', value: 'false' },
        ],
      }],
    },
  },
  webServer: {
    // --strictPort so that a port already taken is an error rather than a
    // silent move to the next one, which would leave Playwright waiting on an
    // address nothing is ever going to answer.
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
})
