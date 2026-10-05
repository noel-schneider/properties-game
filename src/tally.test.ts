import { countFinds } from './game'
import type { Solution } from './hand'

test('a group found counts as one', () => {
  const found: Solution[] = [{ property: 'insect', concepts: ['ant', 'bee', 'moth'] }];

  expect(countFinds(found)).toBe(1);
});

test('a concept added to a group counts as one too', () => {
  // Twelve per cent of the answers in a game are this move, and counting
  // groups alone left every one of them without any sign it had landed.
  const found: Solution[] = [{ property: 'insect', concepts: ['ant', 'bee', 'moth', 'ladybug'] }];

  expect(countFinds(found)).toBe(2);
});

test('nothing found is nothing counted', () => {
  expect(countFinds([])).toBe(0);
});

test('every accepted answer moves it by exactly one', () => {
  const found: Solution[] = [];
  const steps: number[] = [];

  found.push({ property: 'insect', concepts: ['ant', 'bee', 'moth'] });
  steps.push(countFinds(found));
  found[0] = { ...found[0], concepts: [...found[0].concepts, 'ladybug'] };
  steps.push(countFinds(found));
  found.push({ property: 'small', concepts: ['coin', 'key', 'button'] });
  steps.push(countFinds(found));

  expect(steps).toEqual([1, 2, 3]);
});
