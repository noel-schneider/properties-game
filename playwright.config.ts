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
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
