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
    // These tests play as somebody who has been here before. The panel that
    // greets a first arrival covers part of the board on purpose, and what it
    // does is pinned in its own spec, which clears this.
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://localhost:3000',
        localStorage: [{ name: 'properties-game:greeted', value: 'true' }],
      }],
    },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
