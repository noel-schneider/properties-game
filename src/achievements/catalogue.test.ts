import { CATALOGUE } from './catalogue'

test('the catalogue holds nineteen achievements with unique ids', () => {
  expect(CATALOGUE).toHaveLength(19);
  expect(new Set(CATALOGUE.map((a) => a.id)).size).toBe(19);
});

test('twelve are public and seven are secret', () => {
  // Both kinds, deliberately: the public ones are something to aim at, the
  // secret ones something to stumble into.
  expect(CATALOGUE.filter((a) => !a.secret)).toHaveLength(12);
  expect(CATALOGUE.filter((a) => a.secret)).toHaveLength(7);
});

test('every achievement has an icon; names and descriptions live in the locales', () => {
  for (const achievement of CATALOGUE) {
    expect(achievement.icon).not.toBe('');
  }
});
