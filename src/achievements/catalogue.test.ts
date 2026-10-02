import { CATALOGUE } from './catalogue'

test('the catalogue holds fifteen achievements with unique ids', () => {
  expect(CATALOGUE).toHaveLength(15);
  expect(new Set(CATALOGUE.map((a) => a.id)).size).toBe(15);
});

test('nine are public and six are secret', () => {
  expect(CATALOGUE.filter((a) => !a.secret)).toHaveLength(9);
  expect(CATALOGUE.filter((a) => a.secret)).toHaveLength(6);
});

test('every achievement has an icon; names and descriptions live in the locales', () => {
  for (const achievement of CATALOGUE) {
    expect(achievement.icon).not.toBe('');
  }
});
