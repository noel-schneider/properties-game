import { expect, test } from '@playwright/test'
import { boardSettled } from './board'

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

    const bubble = page.getByRole('checkbox').first()
    const early = (await bubble.boundingBox())!

    await boardSettled(page)
    const resting = (await bubble.boundingBox())!

    expect(Math.hypot(resting.x - early.x, resting.y - early.y)).toBeGreaterThan(20)

    await page.waitForTimeout(500)
    const later = (await bubble.boundingBox())!
    expect(Math.hypot(later.x - resting.x, later.y - resting.y)).toBeLessThan(1)
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
