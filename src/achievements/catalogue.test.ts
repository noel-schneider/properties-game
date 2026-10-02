import { CATALOGUE } from './catalogue'

test('the catalogue holds fifteen achievements with unique ids', () => {
  expect(CATALOGUE).toHaveLength(15);
  expect(new Set(CATALOGUE.map((a) => a.id)).size).toBe(15);
});

test('nine are public and six are secret', () => {
  expect(CATALOGUE.filter((a) => !a.secret)).toHaveLength(9);
  expect(CATALOGUE.filter((a) => a.secret)).toHaveLength(6);
});

test('every achievement is presentable', () => {
  for (const achievement of CATALOGUE) {
    expect(achievement.name).not.toBe('');
    expect(achievement.description).not.toBe('');
    expect(achievement.icon).not.toBe('');
  }
});
