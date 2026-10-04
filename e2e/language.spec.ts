import { expect, test } from '@playwright/test'
import { boardSettled } from './board'
import en from '../src/i18n/en.json' with { type: 'json' }
import fr from '../src/i18n/fr.json' with { type: 'json' }

test('the game opens in French for a French browser', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'fr-FR', reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('/')
  await boardSettled(page)

  await expect(page.getByPlaceholder(fr.ui['form.placeholder'])).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  await context.close()
})

test('the game opens in English otherwise', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)

  await expect(page.getByPlaceholder(en.ui['form.placeholder'])).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('the flags switch the whole game over, and the choice sticks', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await boardSettled(page)

  await expect(page.getByPlaceholder(en.ui['form.placeholder'])).toBeVisible()

  // The flags live behind the one flying now, and a hover is what opens them.
  await page.getByRole('button', { name: en.ui['language.group'] }).hover()
  await page.getByRole('button', { name: fr.ui['language.fr'] }).click()

  await expect(page.getByPlaceholder(fr.ui['form.placeholder'])).toBeVisible()
  await expect(page.getByRole('button', { name: fr.ui['form.submit'] })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')

  // The bubbles are renamed too, not just the chrome.
  const shown = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const frenchNames = new Set(Object.values(fr.concepts))
  for (const name of shown) expect(frenchNames).toContain(name)

  await page.reload()
  await boardSettled(page)
  await expect(page.getByPlaceholder(fr.ui['form.placeholder'])).toBeVisible()
})

test('a flag can be reached from the button that opens it', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Language' }).hover()
  await expect(page.locator('.language__list')).toBeVisible()

  // Walk the pointer down to the flag, the way a hand does.
  const flag = page.getByRole('button', { name: 'Passer en français' })
  const box = (await flag.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 })

  await expect(page.locator('.language__list')).toBeVisible()
})
