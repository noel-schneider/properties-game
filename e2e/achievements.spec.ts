import { expect, test } from '@playwright/test'
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
    await page.getByRole('checkbox', { name }).click()
  }
  await page.getByPlaceholder('Type a category here!').fill(property)
  await page.getByRole('button', { name: 'Submit' }).click()
}

test('the first find announces an achievement, and it survives a reload', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await expect(page.getByRole('alert')).toHaveCount(0)

  await solveOnce(page)

  await expect(page.getByRole('alert').filter({ hasText: 'First Light' })).toBeVisible()
  await expect(page.getByRole('alert').first()).toContainText('Achievement unlocked')

  // Earned achievements are kept, so the same one is never announced twice.
  await page.reload()
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
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await solveOnce(page)
  await expect(page.getByRole('alert').first()).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0, { timeout: 8000 })
})

test('the panel names the public achievements and conceals the secret ones', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await page.getByRole('button', { name: /achievements/i }).click()
  const sheet = page.getByRole('dialog')

  await expect(sheet).toContainText('First Light')
  await expect(sheet).toContainText('Find your first category.')
  await expect(sheet).toContainText('Collector')

  // Six secrets, all still concealed.
  await expect(sheet.getByText('???')).toHaveCount(6)
  await expect(sheet).not.toContainText('Night Owl')

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('an earned achievement shows up in the panel after a reload', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await expect(page.getByRole('button', { name: /achievements/i })).toContainText('0 / 14')

  await solveOnce(page)
  await expect(page.getByRole('alert').first()).toBeVisible()

  await page.reload()
  const button = page.getByRole('button', { name: /achievements/i })
  await expect(button).not.toContainText('0 / 14')

  await button.click()
  await expect(page.getByTestId('entry-first-light')).toHaveAttribute('data-earned', 'true')
})

test('the sound can be muted and the choice is remembered', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await page.getByRole('button', { name: 'Mute achievement sound' }).click()
  await page.reload()

  await expect(page.getByRole('button', { name: 'Unmute achievement sound' })).toBeVisible()
})
