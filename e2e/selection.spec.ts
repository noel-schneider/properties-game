import { expect, test } from '@playwright/test'

test('selecting three concepts in the browser enables submit', async ({ page }) => {
  await page.goto('/')

  const submit = page.getByRole('button', { name: 'Submit' })
  await expect(submit).toBeDisabled()

  await page.getByPlaceholder('Type a category here!').fill('biome')
  await expect(submit).toBeDisabled()

  const bubbles = page.getByRole('checkbox')
  await expect(bubbles).toHaveCount(15)

  for (let i = 0; i < 3; i++) {
    await bubbles.nth(i).click()
    await expect(bubbles.nth(i)).toHaveAttribute('aria-checked', 'true')
  }

  await expect(submit).toBeEnabled()
})

test('a concept can be deselected by clicking it again', async ({ page }) => {
  await page.goto('/')

  const bubble = page.getByRole('checkbox').first()
  await bubble.click()
  await expect(bubble).toHaveAttribute('aria-checked', 'true')

  await bubble.click()
  await expect(bubble).toHaveAttribute('aria-checked', 'false')
})
