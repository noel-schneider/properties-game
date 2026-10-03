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
