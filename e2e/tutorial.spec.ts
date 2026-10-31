import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { boardSettled } from './board'

/**
 * A first visit, as a new player has it: nothing in storage at all, so the
 * key the rest of the suite uses to step past the arrival cards is gone too.
 */
test.use({ storageState: { cookies: [], origins: [] } })

const bubble = (page: Page, name: string) => page.locator(`.bubble[aria-label="${name}"]`)

async function middleOf(page: Page, names: string[]) {
  const boxes = await Promise.all(names.map((name) => bubble(page, name).boundingBox()))
  return {
    x: boxes.reduce((sum, b) => sum + b!.x + b!.width / 2, 0) / boxes.length,
    y: boxes.reduce((sum, b) => sum + b!.y + b!.height / 2, 0) / boxes.length,
  }
}

test('a first visit is walked through both gestures, then lands in the game', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)

  const tutorial = page.getByRole('region', { name: 'Tutorial' })
  await expect(tutorial).toContainText('Step 1 of 2')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  // The first gesture: three picked, then named.
  for (const name of ['bee', 'ant', 'ladybug']) await bubble(page, name).click()
  await expect(page.locator('.input')).toBeFocused()
  await page.keyboard.type('insect')
  await page.keyboard.press('Enter')

  await expect(tutorial).toContainText('Step 2 of 2')
  await expect(bubble(page, 'butterfly')).toBeVisible()
  await boardSettled(page)

  // The second: the newcomer dragged onto the group just found. Aimed until
  // the offer names it, as a player would — the group drifts under a drag.
  const from = await middleOf(page, ['butterfly'])
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  let aimed = false
  for (let nudge = 0; nudge < 12 && !aimed; nudge++) {
    const now = await middleOf(page, ['bee', 'ant', 'ladybug'])
    const sway = nudge === 0 ? 0 : 16 * (nudge % 2 === 0 ? 1 : -1) * Math.ceil(nudge / 2)
    await page.mouse.move(now.x + sway, now.y + sway / 2, { steps: 5 })
    aimed = ((await page.locator('.drop-hint').textContent().catch(() => null)) ?? '').length > 0
  }
  expect(aimed, 'never managed to aim at the group').toBe(true)
  await page.mouse.up()

  await expect(tutorial).toContainText('all you need to know')
  await page.getByRole('button', { name: 'Let’s play!' }).click()

  // The game proper, from nothing: the tutorial's group is not carried over.
  await expect(tutorial).toHaveCount(0)
  await expect(page.getByTestId('found')).toHaveText('0')

  // And it is not offered again.
  await page.reload()
  await boardSettled(page)
  await expect(page.getByRole('region', { name: 'Tutorial' })).toHaveCount(0)
})

test('it can be skipped straight away', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)

  await page.getByRole('button', { name: 'Skip the tutorial' }).click()

  await expect(page.getByRole('region', { name: 'Tutorial' })).toHaveCount(0)
  await expect(page.getByTestId('found')).toHaveText('0')
})
