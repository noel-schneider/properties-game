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

    const places = () => page.locator('g.bubble').evaluateAll(
      (bubbles) => bubbles.map((b) => b.getAttribute('transform') ?? ''),
    )
    const before = await places()

    const bubble = page.getByRole('checkbox').first()
    await bubble.click()

    await expect(bubble).toHaveAttribute('aria-checked', 'true')
    await expect(page.locator('.graph')).toHaveAttribute('data-settled', 'true')
    // Settling again is not the same as never having moved: a board that
    // re-scatters on every click reads as a refresh, and comes back to rest
    // fast enough that only the positions give it away. Compared with a
    // tolerance rather than exactly, because letting go of a bubble costs one
    // tick of the simulation and that lands as a hundredth of a pixel.
    const after = await places()
    const moved = before.map((place, i) => {
      const [bx, by] = place.match(/-?\d+\.?\d*/g)!.map(Number)
      const [ax, ay] = after[i].match(/-?\d+\.?\d*/g)!.map(Number)
      return Math.hypot(ax - bx, ay - by)
    })
    expect(Math.max(...moved)).toBeLessThan(1)
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

test('a bubble is lifted off the board by a shadow', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)

  // Pinned in a real browser because jsdom does not implement `filter`.
  const filter = await page.locator('.bubble circle').first()
    .evaluate((circle) => getComputedStyle(circle).filter)

  expect(filter).toContain('drop-shadow')
})

test('enter puts the cursor in the box, without disturbing the board', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)

  // A real mouse click leaves the focus on the bubble it hit, so this is also
  // the guard against Enter quietly deselecting the bubble just clicked.
  const bubble = page.getByRole('checkbox').first()
  await bubble.click()
  await expect(bubble).toHaveAttribute('aria-checked', 'true')

  await page.keyboard.press('Enter')

  await expect(page.getByPlaceholder(/type a category here/i)).toBeFocused()
  await expect(bubble).toHaveAttribute('aria-checked', 'true')
})

test('a bubble reached with the keyboard keeps the enter key for itself', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)

  // Tab until a bubble has the focus ring, which is what tells a keyboard user
  // apart from the focus a mouse click leaves behind.
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab')
    const onBubble = await page.evaluate(
      () => document.activeElement?.getAttribute('role') === 'checkbox',
    )
    if (onBubble) break
  }
  const name = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))
  expect(name).toBeTruthy()

  await page.keyboard.press('Enter')

  await expect(page.locator(`.bubble[aria-label="${name}"]`)).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByPlaceholder(/type a category here/i)).not.toBeFocused()
})

test('pointing at a concept shows what it shares, once something is found', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await boardSettled(page)

  // Nothing found yet, so the board must stay as it is.
  await page.getByRole('checkbox').first().hover()
  await expect(page.locator('.bubble--aside')).toHaveCount(0)

  // Play the one group the dev panel hands over, then point at a member.
  const solved = await page.evaluate(() => {
    const panel = [...document.querySelectorAll('div')]
      .find((d) => /answers \(dev only\)/i.test(d.textContent ?? '') && d.children.length < 30)
    const lines = (panel as HTMLElement).innerText.split('\n').map((l) => l.trim()).filter(Boolean)
    const i = lines.findIndex((l) => l.includes('·'))
    return { property: lines[i - 1], concepts: lines[i].split('·').map((c) => c.trim()) }
  })
  for (const name of solved.concepts) {
    await page.locator(`.bubble[aria-label="${name}"]`).click({ force: true })
  }
  await page.getByPlaceholder(/type a category here/i).fill(solved.property)
  await page.keyboard.press('Enter')
  await boardSettled(page)

  await page.locator(`.bubble[aria-label="${solved.concepts[0]}"]`).hover({ force: true })

  // Its two companions light up, and they are the ones it was found with.
  for (const name of solved.concepts) {
    await expect(page.locator(`.bubble[aria-label="${name}"]`)).toHaveClass(/bubble--kin/)
  }
  await expect(page.locator('.bubble--aside').first()).toBeVisible()
})

test('tabbing to a concept reveals its kin, clicking one does not', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await boardSettled(page)

  const solved = await page.evaluate(() => {
    const panel = [...document.querySelectorAll('div')]
      .find((d) => /answers \(dev only\)/i.test(d.textContent ?? '') && d.children.length < 30)
    const lines = (panel as HTMLElement).innerText.split('\n').map((l) => l.trim()).filter(Boolean)
    const i = lines.findIndex((l) => l.includes('·'))
    return { property: lines[i - 1], concepts: lines[i].split('·').map((c) => c.trim()) }
  })
  for (const name of solved.concepts) {
    await page.locator(`.bubble[aria-label="${name}"]`).click({ force: true })
  }
  await page.getByPlaceholder(/type a category here/i).fill(solved.property)
  await page.keyboard.press('Enter')
  await boardSettled(page)

  // A mouse click leaves the focus on the bubble it hit, and that must not
  // count as a reveal, or the board stays stepped back until the next click.
  // Focus is given here without the pointer, so the pointer's own leaving
  // cannot clear the state and hide the fault.
  await page.locator(`.bubble[aria-label="${solved.concepts[0]}"]`).click({ force: true })
  await page.mouse.move(5, 5)
  await page.locator(`.bubble[aria-label="${solved.concepts[1]}"]`)
    .evaluate((bubble: SVGGElement) => bubble.focus())

  await expect(page.locator('.bubble--aside')).toHaveCount(0)
  await expect(page.locator('.bubble--kin')).toHaveCount(0)

  // Tabbing to one does count: it is the only way a keyboard reaches this.
  // Aimed at a member of the group just found, since a concept that has
  // settled nothing has no kin to reveal.
  let reached = false
  for (let i = 0; i < 60 && !reached; i++) {
    await page.keyboard.press('Tab')
    reached = await page.evaluate(
      (names) => names.includes(document.activeElement?.getAttribute('aria-label') ?? ''),
      solved.concepts,
    )
  }
  expect(reached).toBe(true)

  await expect(page.locator('.bubble--kin')).toHaveCount(solved.concepts.length)
})
