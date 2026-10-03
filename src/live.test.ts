import { isSpent, liveProperties } from './game'
import type { Solution } from './hand'
import type { Concept } from './types'

const ant: Concept = { name: 'ant', properties: ['insect', 'small'] };
const bee: Concept = { name: 'bee', properties: ['insect', 'small'] };
const moth: Concept = { name: 'moth', properties: ['insect'] };
const coin: Concept = { name: 'coin', properties: ['small', 'metal'] };
const pool = [ant, bee, moth, coin];

test('a property with two companions left is still live', () => {
  expect(liveProperties(ant, [], pool)).toEqual(['insect', 'small']);
});

test('a property nobody else can still pair on is not', () => {
  // metal is coin's alone: nothing else in the pool has it.
  expect(liveProperties(coin, [], pool)).toEqual(['small']);
});

test('a property already spent is not counted either', () => {
  const found: Solution[] = [{ property: 'insect', concepts: ['ant', 'bee', 'moth'] }];

  expect(liveProperties(ant, found, pool)).toEqual(['small']);
});

test('what a concept shows is what it could still be used for', () => {
  // After insect is spent by all three, ant's `small` has only coin left for
  // company — one short — so ant has nothing live at all.
  const found: Solution[] = [
    { property: 'insect', concepts: ['ant', 'bee', 'moth'] },
    { property: 'small', concepts: ['bee', 'coin', 'ant'] },
  ];

  expect(liveProperties(ant, found, pool)).toEqual([]);
});

test('having nothing live is exactly what being spent means', () => {
  const found: Solution[] = [{ property: 'insect', concepts: ['ant', 'bee', 'moth'] }];

  for (const concept of pool) {
    expect(liveProperties(concept, found, pool).length === 0).toBe(isSpent(concept, found, pool));
  }
});
