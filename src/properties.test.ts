import { propertyTally } from './properties'
import type { Concept } from './types'
import type { Solution } from './hand'

const pool: Concept[] = [
  { name: 'ant', properties: ['insect', 'small'] },
  { name: 'bee', properties: ['insect', 'small'] },
  { name: 'moth', properties: ['insect', 'night'] },
  { name: 'coin', properties: ['small', 'metal'] },
  { name: 'key', properties: ['small', 'metal'] },
  { name: 'bell', properties: ['metal', 'sound'] },
];

test('a category is complete only when every concept that has it is in it', () => {
  const found: Solution[] = [{ property: 'insect', concepts: ['ant', 'bee', 'moth'] }];
  const [row] = propertyTally(found, pool);

  expect(row).toEqual({ property: 'insect', have: 3, total: 3, complete: true });
});

test('a category still missing a member is counted as partial', () => {
  // "small" belongs to four concepts; three of them make a group.
  const found: Solution[] = [{ property: 'small', concepts: ['ant', 'bee', 'coin'] }];
  const [row] = propertyTally(found, pool);

  expect(row).toEqual({ property: 'small', have: 3, total: 4, complete: false });
});

test('the finished ones come first, so the list reads as a record of wins', () => {
  const found: Solution[] = [
    { property: 'small', concepts: ['ant', 'bee', 'coin'] },
    { property: 'metal', concepts: ['coin', 'key', 'bell'] },
  ];

  expect(propertyTally(found, pool).map((row) => row.property)).toEqual(['metal', 'small']);
});

test('nothing unfound is ever listed, whatever the board is holding', () => {
  // The list sits above the board for a whole game. A category nobody has
  // named would be the answer to a group, handed over for free.
  const found: Solution[] = [{ property: 'insect', concepts: ['ant', 'bee', 'moth'] }];

  expect(propertyTally(found, pool)).toHaveLength(1);
});
