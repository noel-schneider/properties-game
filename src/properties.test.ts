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

test('a category found twice is one line, not two', () => {
  // A property can be found again by different concepts — that is what lets
  // the ones dealt later ever be finished — and the list showed one row per
  // group, so the same category appeared two and three times over.
  const found: Solution[] = [
    { property: 'small', concepts: ['ant', 'bee', 'coin'] },
    { property: 'small', concepts: ['key', 'moth', 'bell'] },
  ];
  const rows = propertyTally(found, pool);

  expect(rows).toHaveLength(1);
  expect(rows[0].property).toBe('small');
});

test('the members of a category found twice are counted together', () => {
  const found: Solution[] = [
    { property: 'metal', concepts: ['coin', 'key', 'bell'] },
    { property: 'metal', concepts: ['coin', 'key', 'bell'] },
  ];
  const [row] = propertyTally(found, pool);

  // The same three counted once, not six out of three.
  expect(row.have).toBe(3);
  expect(row.total).toBe(3);
  expect(row.complete).toBe(true);
});
