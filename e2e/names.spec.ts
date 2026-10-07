import { expect, test } from '@playwright/test'
import { boardSettled } from './board'
import { findSolvableTriple } from './triples'

/** Names one category on the board, and gives back what it was and by whom. */
async function nameACategory(page: import('@playwright/test').Page) {
  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const { names, property } = findSolvableTriple(dealt)

  for (const name of names) {
    await page.getByRole('checkbox', { name, exact: true }).click()
  }
  await page.locator('.input').fill(property)
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByRole('status')).toHaveText(/correct/i)

  return { property, names }
}

test('the board keeps no names on it', async ({ page }) => {
  // Naming every category found put the record of the game on top of the board
  // it was a record of: ten of them already stacked over the bubbles they
  // belonged to. The record is the column down the left; the board stays a
  // board.
  await page.goto('/')
  await boardSettled(page)

  await nameACategory(page)
  await boardSettled(page)

  await expect(page.locator('.found__label')).toHaveCount(0)
})

test('and says a category only while one of its concepts is pointed at', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)

  const { property, names } = await nameACategory(page)
  await boardSettled(page)

  await page.getByRole('checkbox', { name: names[0], exact: true }).hover()
  await expect(page.locator('.found__label', { hasText: property })).toBeVisible()
})
