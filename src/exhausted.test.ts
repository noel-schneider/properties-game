import { isExhausted } from './board'
import type { Solution } from './hand'
import type { Concept } from './types'

const pool: Concept[] = [
  { name: 'ant', properties: ['insect', 'small'] },
  { name: 'bee', properties: ['insect', 'small'] },
  { name: 'moth', properties: ['insect'] },
  { name: 'coin', properties: ['small'] },
];

test('a game with a group still to form is not over', () => {
  expect(isExhausted(pool, [])).toBe(false);
});

test('a game where a concept can still join a category found is not over', () => {
  // insect is spent by all three, and `small` has only ant, bee and coin —
  // of which ant and bee have spent nothing of it. So `small` is formable.
  const found: Solution[] = [{ property: 'insect', concepts: ['ant', 'bee', 'moth'] }];

  expect(isExhausted(pool, found)).toBe(false);
});

test('a game with neither is over', () => {
  const found: Solution[] = [
    { property: 'insect', concepts: ['ant', 'bee', 'moth'] },
    { property: 'small', concepts: ['ant', 'bee', 'coin'] },
  ];

  expect(isExhausted(pool, found)).toBe(true);
});

test('a lone concept left over keeps the game alive', () => {
  // `small` has been found by three, and coin still holds it with nobody to
  // pair with — which is exactly the move a drop onto that group makes.
  const four: Concept[] = [...pool, { name: 'key', properties: ['small'] }];
  const found: Solution[] = [
    { property: 'insect', concepts: ['ant', 'bee', 'moth'] },
    { property: 'small', concepts: ['ant', 'bee', 'coin'] },
  ];

  expect(isExhausted(four, found)).toBe(false);
});
