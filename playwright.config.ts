import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
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
        origin: 'http://localhost:3000',
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
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
