import { expect, test } from '@playwright/test'
import { boardSettled } from './board'
import data from '../src/concepts.json' with { type: 'json' }

const properties = data as Record<string, string[]>
const FOUND_KEY = 'properties-game:found'

interface Group { property: string; concepts: string[] }

/**
 * Plays the whole game greedily and returns every group found, in order.
 *
 * The run ends when no three concepts anywhere still share an unspent
 * property — a category of N members yields floor(N/3) groups and strands the
 * remainder, so "every concept finished" is arithmetically out of reach.
 */
function wholeGame(): Group[] {
  const open = new Map<string, Set<string>>()
  for (const [name, props] of Object.entries(properties)) open.set(name, new Set(props))

  const found: Group[] = []
  for (;;) {
    const byProperty = new Map<string, string[]>()
    for (const [name, props] of open) {
      for (const property of props) byProperty.set(property, [...(byProperty.get(property) ?? []), name])
    }

    const next = [...byProperty.entries()].find(([, names]) => names.length >= 3)
    if (!next) break

    const [property, names] = next
    const members = names.slice(0, 3)
    for (const name of members) open.get(name)!.delete(property)
    found.push({ property, concepts: members })
  }
  return found
}

/** Starts the game one group short of the end. */
async function oneGroupLeft(page: import('@playwright/test').Page) {
  const all = wholeGame()
  const last = all[all.length - 1]

  await page.goto('/')
  await page.evaluate(
    ({ key, found }) => {
      localStorage.clear()
      localStorage.setItem(key, JSON.stringify(found))
    },
    { key: FOUND_KEY, found: all.slice(0, -1) },
  )
  await page.reload()
  await boardSettled(page)
  return last
}

test('the whole game can be played out', () => {
  const all = wholeGame()

  expect(all.length).toBeGreaterThan(90)
  expect(new Set(all.map((g) => g.property)).size).toBeGreaterThan(40)
})

test('a game one group short still offers that group', async ({ page }) => {
  const last = await oneGroupLeft(page)

  for (const name of last.concepts) {
    await expect(page.getByLabel(name, { exact: true })).toBeVisible()
  }
  await expect(page.getByTestId('remaining')).not.toHaveText('0')
})

test('finding the last group ends the run and offers a fresh one', async ({ page }) => {
  const last = await oneGroupLeft(page)

  for (const name of last.concepts) {
    await page.getByRole('checkbox', { name, exact: true }).click()
  }
  await page.getByPlaceholder('Type a category here!').fill(last.property)
  await page.getByRole('button', { name: 'Submit' }).click()

  const summary = page.getByRole('dialog', { name: /run complete/i })
  await expect(summary).toBeVisible()
  await expect(summary).toContainText('You found every category')

  await page.getByRole('button', { name: 'Play again' }).click()
  await expect(page.getByRole('dialog', { name: /run complete/i })).toHaveCount(0)
  await expect(page.getByTestId('found')).toHaveText('0')
})

test('keeping on playing leaves the finished game intact', async ({ page }) => {
  const last = await oneGroupLeft(page)

  for (const name of last.concepts) {
    await page.getByRole('checkbox', { name, exact: true }).click()
  }
  await page.getByPlaceholder('Type a category here!').fill(last.property)
  await page.getByRole('button', { name: 'Submit' }).click()
  await page.getByRole('button', { name: 'Keep playing' }).click()

  await expect(page.getByRole('dialog', { name: /run complete/i })).toHaveCount(0)
  await expect(page.getByTestId('remaining')).toHaveText('0')
})
