import { expect, test } from '@playwright/test'
import { boardSettled } from './board'
import data from '../src/concepts.json' with { type: 'json' }

const properties = data as Record<string, string[]>
const ALL = [...new Set(Object.values(properties).flat())]

/** Starts the game one category short of the end. */
async function startOneShort(page: import('@playwright/test').Page, missing: string) {
  await page.goto('/')
  await boardSettled(page)
  await page.evaluate(
    ({ missing, all }) => {
      localStorage.clear()
      localStorage.setItem(
        'properties-game:achievements',
        JSON.stringify({
          unlocked: [],
          propertiesFound: all.filter((p: string) => p !== missing),
          aliasAnswers: 0,
          exactAnswers: 0,
        }),
      )
    },
    { missing, all: ALL },
  )
  await page.reload()
  await boardSettled(page)
}

async function solveMissing(page: import('@playwright/test').Page, missing: string) {
  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const group = dealt.filter((name) => properties[name].includes(missing)).slice(0, 3)
  expect(group).toHaveLength(3)

  for (const name of group) {
    await page.getByRole('checkbox', { name, exact: true }).click()
  }
  await page.getByPlaceholder('Type a category here!').fill(missing)
  await page.getByRole('button', { name: 'Submit' }).click()
}

test('the board always offers the category still missing', async ({ page }) => {
  await startOneShort(page, ALL[0])

  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  expect(dealt.filter((name) => properties[name].includes(ALL[0])).length).toBeGreaterThanOrEqual(3)
})

test('finding the last category ends the run and offers a fresh one', async ({ page }) => {
  const missing = ALL[0]
  await startOneShort(page, missing)

  await expect(page.getByTestId('categories')).toHaveText(`${ALL.length - 1} / ${ALL.length}`)

  await solveMissing(page, missing)

  const summary = page.getByRole('dialog', { name: /run complete/i })
  await expect(summary).toBeVisible()
  await expect(summary).toContainText('You found every category')
  await expect(summary).toContainText(String(ALL.length))

  await page.getByRole('button', { name: 'Play again' }).click()
  await expect(page.getByRole('dialog', { name: /run complete/i })).toHaveCount(0)
  await expect(page.getByTestId('categories')).toHaveText(`0 / ${ALL.length}`)
})

test('finishing unlocks Completionist, and it survives the reset', async ({ page }) => {
  const missing = ALL[0]
  await startOneShort(page, missing)

  await solveMissing(page, missing)
  await expect(page.getByRole('alert').filter({ hasText: 'Completionist' })).toBeVisible()

  await page.getByRole('button', { name: 'Play again' }).click()
  await page.getByRole('button', { name: /achievements/i }).click()
  await expect(page.getByTestId('entry-completionist')).toHaveAttribute('data-earned', 'true')
})

test('keeping on playing leaves the finished run intact', async ({ page }) => {
  const missing = ALL[0]
  await startOneShort(page, missing)

  await solveMissing(page, missing)
  await page.getByRole('button', { name: 'Keep playing' }).click()

  await expect(page.getByRole('dialog', { name: /run complete/i })).toHaveCount(0)
  await expect(page.getByTestId('categories')).toHaveText(`${ALL.length} / ${ALL.length}`)
})
