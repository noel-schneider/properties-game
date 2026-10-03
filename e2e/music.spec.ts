import { test, expect } from '@playwright/test'

/**
 * The music cannot be heard from here, so what is checked is that asking for it
 * really builds and starts oscillators in a real browser — the part jsdom
 * cannot answer at all, having no audio of any kind.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const made: number[] = [];
    (window as unknown as { started: number[] }).started = made;
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function (this: AudioContext) {
      const oscillator = create.call(this);
      // Recorded where the pitch is set, not where the note starts: a scheduled
      // value has not reached .value yet when start() runs, so reading it there
      // reports the oscillator's default 440 for every voice.
      const schedule = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
      oscillator.frequency.setValueAtTime = (value: number, when: number) => {
        made.push(value);
        return schedule(value, when);
      };
      return oscillator;
    };
  });
});

const voices = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { started: number[] }).started.length);

test('nothing plays until the music is asked for', async ({ page }) => {
  await page.goto('/');
  await page.locator('.bubble').first().click();

  expect(await voices(page)).toBe(0);
});

test('asking for the music starts a chord', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play music' }).click();

  await expect.poll(() => voices(page)).toBeGreaterThanOrEqual(4);
});

test('the chord is low and wide, which is what makes it a bed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play music' }).click();
  await expect.poll(() => voices(page)).toBeGreaterThanOrEqual(4);

  const pitches = await page.evaluate(() => (window as unknown as { started: number[] }).started);
  for (const hz of pitches) {
    expect(hz).toBeGreaterThan(80);
    expect(hz).toBeLessThan(560);
  }
  expect(new Set(pitches).size).toBeGreaterThan(1);
});

test('stopping it starts nothing more, and the choice is remembered', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play music' }).click();
  await expect.poll(() => voices(page)).toBeGreaterThanOrEqual(4);

  await page.getByRole('button', { name: 'Stop music' }).click();
  const after = await voices(page);
  await page.waitForTimeout(1200);
  expect(await voices(page)).toBe(after);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Play music' })).toBeVisible();
})
