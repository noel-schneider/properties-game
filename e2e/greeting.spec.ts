import { expect, test } from '@playwright/test'

// Every other spec plays as a returning player, seeded in the config. This one
// arrives for the first time.
test.use({ storageState: { cookies: [], origins: [] } })

test('every arrival is shown how to play', async ({ page }) => {
  await page.goto('/')

  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible()
  await expect(sheet.getByRole('listitem')).toHaveCount(5)

  // In the middle of the screen, not hanging off the question mark.
  const card = (await page.locator('.greeting__card').boundingBox())!
  const view = page.viewportSize()!
  const middle = card.x + card.width / 2
  expect(Math.abs(middle - view.width / 2)).toBeLessThan(2)
  expect(card.width).toBeGreaterThan(400)

  // It does not follow the pointer the way the panel normally does: a greeting
  // that vanishes before it is read is no greeting.
  await page.mouse.move(640, 400)
  await expect(sheet).toBeVisible()

  await page.getByRole('button', { name: 'Got it' }).click()
  await expect(sheet).toBeHidden()

  // And again next time: nothing is remembered between visits, because
  // somebody coming back after a week has forgotten the gestures too.
  await page.reload()
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('and the panel still answers the question mark afterwards', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Got it' }).click()

  await page.getByRole('button', { name: 'How to play' }).hover()
  await expect(page.getByRole('dialog')).toBeVisible()
})
