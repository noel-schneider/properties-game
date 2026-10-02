import { expect, test } from '@playwright/test'
import { boardSettled } from './board'
import data from '../src/concepts.json' with { type: 'json' }

const TOTAL_CATEGORIES = new Set(Object.values(data as Record<string, string[]>).flat()).size

const properties = data as Record<string, string[]>

/** Three concepts on screen that share a property, plus that property. */
function findSolvableTriple(dealt: string[]): { names: string[]; property: string } {
  for (let a = 0; a < dealt.length; a++) {
    for (let b = a + 1; b < dealt.length; b++) {
      for (let c = b + 1; c < dealt.length; c++) {
        const triple = [dealt[a], dealt[b], dealt[c]]
        const property = properties[triple[0]].find((p) =>
          triple.every((name) => properties[name].includes(p)),
        )
        if (property) return { names: triple, property }
      }
    }
  }
  throw new Error('the dealt hand has no solvable triple, which dealHand should prevent')
}

test('naming the shared category is accepted', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)

  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const { names, property } = findSolvableTriple(dealt)

  for (const name of names) {
    await page.getByRole('checkbox', { name, exact: true }).click()
  }
  await page.getByPlaceholder('Type a category here!').fill(property)
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByRole('status')).toHaveText(/correct/i)
})

test('a wrong category is rejected', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)

  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const { names } = findSolvableTriple(dealt)

  for (const name of names) {
    await page.getByRole('checkbox', { name, exact: true }).click()
  }
  await page.getByPlaceholder('Type a category here!').fill('not a real category at all')
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByRole('status')).toHaveText(/not quite/i)
})

test('pressing Enter submits the guess', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)

  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const { names, property } = findSolvableTriple(dealt)

  for (const name of names) {
    await page.getByRole('checkbox', { name, exact: true }).click()
  }
  await page.getByPlaceholder('Type a category here!').fill(property)
  await page.getByPlaceholder('Type a category here!').press('Enter')

  await expect(page.getByRole('status')).toHaveText(/correct/i)
})

test('a solved group stays on the board, tied and named, and play continues', async ({ page }) => {
  // Start from a clean record, then read the board that comes with it.
  await page.goto('/')
  await boardSettled(page)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await boardSettled(page)
  await expect(page.getByTestId('categories')).toHaveText(`0 / ${TOTAL_CATEGORIES}`)

  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const { names, property } = findSolvableTriple(dealt)

  for (const name of names) {
    await page.getByRole('checkbox', { name, exact: true }).click()
  }
  await page.getByPlaceholder('Type a category here!').fill(property)
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByRole('status')).toHaveText(/correct/i)
  await expect(page.getByTestId('categories')).toHaveText(`1 / ${TOTAL_CATEGORIES}`)

  // The three stay on the board, no longer selectable, drawn as a found group.
  for (const name of names) {
    await expect(page.getByRole('checkbox', { name, exact: true })).toHaveCount(0)
    await expect(page.getByLabel(name, { exact: true })).toHaveAttribute('data-found', 'true')
  }
  await expect(page.getByRole('checkbox')).toHaveCount(15 - names.length)
  await expect(page.locator('.found__tie')).toHaveCount(names.length)
  await expect(page.locator('.found__label')).toHaveText(property)
  await expect(page.getByPlaceholder('Type a category here!')).toHaveValue('')
})
