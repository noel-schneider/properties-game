import { DEFAULT_PALETTE, PALETTES, isPalette } from './palettes'

test('every palette is complete, so none can render as a half-painted sky', () => {
  expect(PALETTES.length).toBeGreaterThan(1);

  for (const palette of PALETTES) {
    expect(palette.washes).toHaveLength(3);
    for (const wash of palette.washes) {
      // "r, g, b" — the form rgba(var(--x), a) needs, not a hex colour.
      expect(wash.rgb).toMatch(/^\d{1,3}, \d{1,3}, \d{1,3}$/);
      expect(wash.alpha).toBeGreaterThan(0);
      expect(wash.alpha).toBeLessThan(1);
    }
    expect(palette.sky).toMatch(/^#[0-9a-f]{6}$/);
    expect(palette.deep).toMatch(/^#[0-9a-f]{6}$/);
  }
});

test('palette ids are distinct, since the stored choice is one of them', () => {
  const ids = PALETTES.map((p) => p.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids).toContain(DEFAULT_PALETTE);
});

test('a palette id is recognised, and anything else is not', () => {
  expect(isPalette(DEFAULT_PALETTE)).toBe(true);
  expect(isPalette('chartreuse')).toBe(false);
  expect(isPalette(null)).toBe(false);
  expect(isPalette(7)).toBe(false);
});
