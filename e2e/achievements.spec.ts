import { expect, test } from '@playwright/test'
import { boardSettled } from './board'
import data from '../src/concepts.json' with { type: 'json' }

const properties = data as Record<string, string[]>

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

async function solveOnce(page: import('@playwright/test').Page) {
  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const { names, property } = findSolvableTriple(dealt)
  for (const name of names) {
    await page.getByRole('checkbox', { name, exact: true }).click()
  }
  await page.getByPlaceholder('Type a category here!').fill(property)
  await page.getByRole('button', { name: 'Submit' }).click()
}

test('the first find announces an achievement, and it survives a reload', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await boardSettled(page)

  await expect(page.getByRole('alert')).toHaveCount(0)

  await solveOnce(page)

  await expect(page.getByRole('alert').filter({ hasText: 'First Light' })).toBeVisible()
  await expect(page.getByRole('alert').first()).toContainText('Achievement unlocked')

  // Earned achievements are kept, so the same one is never announced twice.
  await page.reload()
  await boardSettled(page)
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('properties-game:achievements') ?? '{}'),
  )
  expect(stored.unlocked).toContain('first-light')

  await expect(page.getByRole('alert')).toHaveCount(0)
  await solveOnce(page)
  await expect(page.getByRole('alert').filter({ hasText: 'First Light' })).toHaveCount(0)
})

test('the announcement clears itself after a few seconds', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await boardSettled(page)

  await solveOnce(page)
  await expect(page.getByRole('alert').first()).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0, { timeout: 8000 })
})

test('the panel names the public achievements and conceals the secret ones', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await boardSettled(page)

  await page.getByRole('button', { name: /achievements/i }).click()
  const sheet = page.getByRole('dialog')

  await expect(sheet).toContainText('First Light')
  await expect(sheet).toContainText('Find your first category.')
  await expect(sheet).toContainText('Collector')

  // Every secret still unearned is concealed. Counted rather than fixed at
  // six: one of them is earned simply by playing between two and four in the
  // morning, and naming it here made this fail for two hours every night.
  const hidden = await sheet.getByText('???').count()
  const unearned = await sheet.locator('[data-earned="false"]').count()
  expect(hidden).toBeGreaterThan(0)
  expect(hidden).toBeLessThanOrEqual(unearned)

  // A secret the player has not earned never gives its name away.
  for (const secret of await sheet.locator('[data-secret="true"][data-earned="false"]').all()) {
    await expect(secret).toContainText('???')
  }

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('an earned achievement shows up in the panel after a reload', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await boardSettled(page)

  // Read rather than assumed to be zero: one achievement is earned simply by
  // playing between two and four in the morning, so a suite that expects none
  // at the start fails for two hours every night.
  const button = page.getByRole('button', { name: /achievements/i })
  const earned = async () => Number((await button.textContent())!.match(/(\d+)\s*\//)![1])
  const before = await earned()

  await solveOnce(page)
  await expect(page.getByRole('alert').first()).toBeVisible()

  await page.reload()

  await boardSettled(page)
  await expect.poll(earned).toBeGreaterThan(before)

  await button.click()
  await expect(page.getByTestId('entry-first-light')).toHaveAttribute('data-earned', 'true')
})

test('the sound can be muted and the choice is remembered', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await boardSettled(page)

  await page.getByRole('button', { name: 'Mute achievement sound' }).click()
  await page.reload()
  await boardSettled(page)

  await expect(page.getByRole('button', { name: 'Unmute achievement sound' })).toBeVisible()
})



test('the sound can be muted from the corner, and the choice sticks', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await boardSettled(page)

  await page.getByRole('button', { name: 'Mute achievement sound' }).click()
  await page.reload()
  await boardSettled(page)

  await expect(page.getByRole('button', { name: 'Unmute achievement sound' })).toBeVisible()
})

