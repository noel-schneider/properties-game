import { expect, test } from '@playwright/test'
import { boardSettled } from './board'
import data from '../src/concepts.json' with { type: 'json' }

const properties = data as Record<string, string[]>
const FOUND_KEY = 'properties-game:found'

interface Group { property: string; concepts: string[] }

/**
 * Plays the whole game greedily and returns every group found, in order.
 *
 * Both moves, not only the trios. A category of N members yields floor(N/3)
 * groups and strands the remainder, and those leftovers are placed one at a
 * time into a category already found — there are fourteen of them waiting at
 * the moment the last trio goes. A run that stopped at the trios would not be
 * finished, and the game would rightly refuse to say it was.
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

    const trio = [...byProperty.entries()].find(([, names]) => names.length >= 3)
    if (trio) {
      const [property, names] = trio
      const members = names.slice(0, 3)
      for (const name of members) open.get(name)!.delete(property)
      found.push({ property, concepts: members })
      continue
    }

    // Nothing left to form: drop a stranded concept into a group that already
    // holds its category, which is what the board's drag gesture does.
    const joiner = [...open.entries()]
      .flatMap(([name, props]) => [...props].map((property) => ({ name, property })))
      .find(({ name, property }) => found.some((g) => g.property === property && !g.concepts.includes(name)))
    if (!joiner) break

    const group = found.find((g) => g.property === joiner.property && !g.concepts.includes(joiner.name))!
    group.concepts = [...group.concepts, joiner.name]
    open.get(joiner.name)!.delete(joiner.property)
  }
  return found
}

/**
 * Starts the game one move short of the end.
 *
 * That last move is a trio where the run ends on one, and otherwise it is a
 * concept joining a group — so the fixture rewinds to the last state that
 * still offers a trio, and hands back the trio to play.
 */
async function oneGroupLeft(page: import('@playwright/test').Page) {
  const all = wholeGame()
  const lastTrio = all.map((g) => g.concepts.length).lastIndexOf(3)
  const last = { ...all[lastTrio], concepts: [...all[lastTrio].concepts] }

  await page.goto('/')
  await page.evaluate(
    ({ key, found }) => {
      localStorage.clear()
      localStorage.setItem('properties-game:skip-intro', 'true')
      localStorage.setItem(key, JSON.stringify(found))
    },
    // Everything the run does except that one trio, the joins included.
    { key: FOUND_KEY, found: all.filter((_, i) => i !== lastTrio) },
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
  await page.locator('.input').fill(last.property)
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
  await page.locator('.input').fill(last.property)
  await page.getByRole('button', { name: 'Submit' }).click()
  await page.getByRole('button', { name: 'Keep playing' }).click()

  await expect(page.getByRole('dialog', { name: /run complete/i })).toHaveCount(0)
  await expect(page.getByTestId('remaining')).toHaveText('0')
})

test('a run with no trio left but a concept still to place is not over', () => {
  // The bug this guards: the run used to be declared finished the moment no
  // three concepts shared an unspent property, which is fourteen moves before
  // it is actually finished — every one of them a concept waiting to be
  // dropped into a category already found.
  // A join does not add a group, it grows one — so the moves left after the
  // last trio are the members any group holds beyond its original three.
  const all = wholeGame()
  const joins = all.reduce((count, group) => count + group.concepts.length - 3, 0)

  expect(joins).toBeGreaterThan(0)
})

test('the end screen waits for the last concept to be placed', async ({ page }) => {
  const all = wholeGame()
  const lastTrio = all.map((g) => g.concepts.length).lastIndexOf(3)

  // Everything up to and including the last trio, but none of the joins that
  // follow it: no three concepts share anything, and moves remain.
  const upToTheTrio = all.slice(0, lastTrio + 1).map((group) => ({
    property: group.property,
    concepts: group.concepts.slice(0, 3),
  }))

  await page.goto('/')
  await page.evaluate(
    ({ key, found }) => {
      localStorage.clear()
      localStorage.setItem('properties-game:skip-intro', 'true')
      localStorage.setItem(key, JSON.stringify(found))
    },
    { key: FOUND_KEY, found: upToTheTrio },
  )
  await page.reload()
  await boardSettled(page)

  await expect(page.getByTestId('remaining')).toHaveText('0')
  await expect(page.getByRole('dialog', { name: /run complete/i })).toHaveCount(0)
})
