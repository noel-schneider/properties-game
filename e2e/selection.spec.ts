import { expect, test } from '@playwright/test'
import { boardSettled } from './board'
import data from '../src/concepts.json' with { type: 'json' }

const properties = data as Record<string, string[]>

/** Three of the dealt concepts that share a category, and that category. */
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
  throw new Error('the board has no solvable triple, which it always should')
}

test('selecting three concepts in the browser enables submit', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)

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
  await boardSettled(page)

  const bubble = page.getByRole('checkbox').first()
  await bubble.click()
  await expect(bubble).toHaveAttribute('aria-checked', 'true')

  await bubble.click()
  await expect(bubble).toHaveAttribute('aria-checked', 'false')
})

// These are about the motion itself, so they take the board animated.
test.describe('with the board in motion', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('the bubbles drift into place, then stop', async ({ page }) => {
    await page.goto('/')

    const board = page.locator('.graph')
    await expect(board).toHaveAttribute('data-settled', 'false')

    // Averaged over the board: any one bubble may happen to start near where
    // it ends up, and the claim is about the board drifting into place.
    const places = () =>
      page.getByRole('checkbox').evaluateAll((nodes) =>
        nodes.map((n) => {
          const box = n.getBoundingClientRect()
          return { x: box.x, y: box.y }
        }),
      )
    const travelled = (from: { x: number; y: number }[], to: { x: number; y: number }[]) =>
      from.reduce((sum, a, i) => sum + Math.hypot(to[i].x - a.x, to[i].y - a.y), 0) / from.length

    const early = await places()

    await boardSettled(page)
    const resting = await places()
    expect(travelled(early, resting)).toBeGreaterThan(10)

    await page.waitForTimeout(500)
    expect(travelled(resting, await places())).toBeLessThan(1)
  })

  test('a bubble can be dragged around the board', async ({ page }) => {
    await page.goto('/')
    await boardSettled(page)

    const bubble = page.getByRole('checkbox').first()
    const before = (await bubble.boundingBox())!

    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
    await page.mouse.down()
    await page.mouse.move(before.x + before.width / 2 + 160, before.y + before.height / 2 - 120, { steps: 12 })
    await page.mouse.up()

    const after = (await bubble.boundingBox())!
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThan(80)
  })

  test('dragging a bubble does not select it', async ({ page }) => {
    await page.goto('/')
    await boardSettled(page)

    const bubble = page.getByRole('checkbox').first()
    const box = (await bubble.boundingBox())!

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 140, box.y + box.height / 2, { steps: 10 })
    await page.mouse.up()

    await expect(bubble).toHaveAttribute('aria-checked', 'false')
  })

  test('a plain click still selects, and leaves the board at rest', async ({ page }) => {
    await page.goto('/')
    await boardSettled(page)

    const bubble = page.getByRole('checkbox').first()
    await bubble.click()

    await expect(bubble).toHaveAttribute('aria-checked', 'true')
    await expect(page.locator('.graph')).toHaveAttribute('data-settled', 'true')
  })
})

test('starting over asks first, and keeps the achievements', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await boardSettled(page)

  // Find something, so there is progress worth protecting.
  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const { names, property } = findSolvableTriple(dealt)
  for (const name of names) {
    await page.getByRole('checkbox', { name, exact: true }).click()
  }
  await page.getByPlaceholder('Type a category here!').fill(property)
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('found')).toHaveText('1')

  // Backing out leaves it alone.
  await page.getByRole('button', { name: 'Start over', exact: true }).click()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByTestId('found')).toHaveText('1')

  // Confirming clears the game but not what was earned.
  const earned = await page.getByRole('button', { name: /Achievements/ }).textContent()
  await page.getByRole('button', { name: 'Start over', exact: true }).click()
  await page.getByRole('button', { name: 'Clear and start over' }).click()

  await expect(page.getByTestId('found')).toHaveText('0')
  await expect(page.getByRole('button', { name: /Achievements/ })).toHaveText(earned!)
})
