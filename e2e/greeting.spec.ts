import { expect, test } from '@playwright/test'

// Every other spec plays as a returning player, seeded in the config. This one
// arrives for the first time.
test.use({ storageState: { cookies: [], origins: [] } })

test('a first arrival is shown how to play, once', async ({ page }) => {
  await page.goto('/')

  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible()
  await expect(sheet.getByRole('listitem')).toHaveCount(5)

  // It does not follow the pointer the way the panel normally does: a greeting
  // that vanishes before it is read is no greeting.
  await page.mouse.move(640, 400)
  await expect(sheet).toBeVisible()

  await page.getByRole('button', { name: 'Got it' }).click()
  await expect(sheet).toBeHidden()

  await page.reload()
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('and the panel still answers the question mark afterwards', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Got it' }).click()

  await page.getByRole('button', { name: 'How to play' }).hover()
  await expect(page.getByRole('dialog')).toBeVisible()
})
