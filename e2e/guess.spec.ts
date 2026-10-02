import { expect, test } from '@playwright/test'
import data from '../src/concepts.json' with { type: 'json' }

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

  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const { names, property } = findSolvableTriple(dealt)

  for (const name of names) {
    await page.getByRole('checkbox', { name }).click()
  }
  await page.getByPlaceholder('Type a category here!').fill(property)
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByRole('status')).toHaveText(/correct/i)
})

test('a wrong category is rejected', async ({ page }) => {
  await page.goto('/')

  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const { names } = findSolvableTriple(dealt)

  for (const name of names) {
    await page.getByRole('checkbox', { name }).click()
  }
  await page.getByPlaceholder('Type a category here!').fill('not a real category at all')
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByRole('status')).toHaveText(/not quite/i)
})

test('pressing Enter submits the guess', async ({ page }) => {
  await page.goto('/')

  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const { names, property } = findSolvableTriple(dealt)

  for (const name of names) {
    await page.getByRole('checkbox', { name }).click()
  }
  await page.getByPlaceholder('Type a category here!').fill(property)
  await page.getByPlaceholder('Type a category here!').press('Enter')

  await expect(page.getByRole('status')).toHaveText(/correct/i)
})

test('a solved group leaves the board, the score rises, and play continues', async ({ page }) => {
  await page.goto('/')

  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const { names, property } = findSolvableTriple(dealt)

  await expect(page.getByTestId('score')).toHaveText('0')

  for (const name of names) {
    await page.getByRole('checkbox', { name }).click()
  }
  await page.getByPlaceholder('Type a category here!').fill(property)
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByRole('status')).toHaveText(/correct/i)
  await expect(page.getByTestId('score')).toHaveText('1')

  for (const name of names) {
    await expect(page.getByRole('checkbox', { name })).toHaveCount(0)
  }
  await expect(page.getByRole('checkbox')).toHaveCount(15)
  await expect(page.getByPlaceholder('Type a category here!')).toHaveValue('')
})
