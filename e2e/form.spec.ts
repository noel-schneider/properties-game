import { test, expect } from '@playwright/test'
import data from '../src/concepts.json' with { type: 'json' }

const properties = data as Record<string, string[]>

/**
 * The answer line used to push the box it belongs to.
 *
 * The whole thing is centred on a point near the bottom of the screen, so a
 * message appearing moved the input up and the hint under it down: two pixels
 * for one line, and far more as soon as a message wrapped — which every
 * message did at the narrow end of the box.
 */
test('nothing moves while the box is being answered', async ({ page }) => {
  test.setTimeout(90_000)
  for (const width of [1280, 820]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    // Measured only once the webfont has arrived: Poppins swapping in changes
    // the height of the input by six pixels, and whichever measurement happens
    // to straddle that moment disagrees with the others for no reason the
    // layout is to blame for.
    await page.evaluate(() => document.fonts.ready)

    const where = async () => ({
      input: Math.round((await page.locator('.input').boundingBox())!.y),
      hint: Math.round((await page.locator('.press-enter-wrapper').boundingBox())!.y),
    })

    const idle = await where()

    // One concept picked: the box goes grey and swaps its placeholder for the
    // reminder, which is the moment the layout used to shift.
    await page.locator('.bubble').first().click()
    await expect(page.locator('.input')).toHaveAttribute('readonly', '')
    const short = await where()

    const dealt = await page.getByRole('checkbox').evaluateAll((n) => n.map((e) => e.getAttribute('aria-label')!))
    for (const name of dealt.slice(1, 3)) await page.getByRole('checkbox', { name, exact: true }).click()
    await page.locator('.input').fill('zzzzzzzz')
    await page.getByRole('button', { name: 'Submit' }).click()
    const wrong = await where()
    const text = await page.locator('.feedback').textContent()

    expect(text).toMatch(/not a category/i)
    expect(short).toEqual(idle)
    expect(wrong).toEqual(idle)
  }
})

test('a category one of the three has spent is told apart from a miss', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/')

  const dealt = await page.getByRole('checkbox').evaluateAll((n) => n.map((e) => e.getAttribute('aria-label')!))
  let hit: { names: string[]; property: string } | null = null
  outer: for (let a = 0; a < dealt.length; a++)
    for (let b = a + 1; b < dealt.length; b++)
      for (let c = b + 1; c < dealt.length; c++) {
        const triple = [dealt[a], dealt[b], dealt[c]]
        const property = properties[triple[0]].find((p) => triple.every((n) => properties[n].includes(p)))
        if (property) { hit = { names: triple, property }; break outer }
      }
  expect(hit).not.toBeNull()

  const answer = async () => {
    for (const name of hit!.names) await page.getByRole('checkbox', { name, exact: true }).click()
    await page.locator('.input').fill(hit!.property)
    await page.getByRole('button', { name: 'Submit' }).click()
  }

  await answer()
  await expect(page.getByRole('status')).toHaveText(/correct/i)

  // The very same three and the very same word: they do share it, and all
  // three have now spent it. Saying they share nothing would be false.
  await answer()
  await expect(page.getByRole('status')).toHaveText(/already used/i)
})
