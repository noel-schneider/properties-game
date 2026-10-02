import { canJoin, joinGroup } from './join'
import { openProperties } from './game'
import type { Solution } from './hand'
import type { Concept } from './types'

const ant: Concept = { name: 'ant', properties: ['insect', 'small'] };
const ladybug: Concept = { name: 'ladybug', properties: ['insect', 'small'] };
const coin: Concept = { name: 'coin', properties: ['small', 'metal'] };

const insects: Solution = { property: 'insect', concepts: ['ant', 'bee', 'moth'] };

test('a concept that still has the category open can join the group', () => {
  expect(canJoin(ladybug, insects, [insects])).toBe(true);
});

test('a concept without the category cannot join', () => {
  expect(canJoin(coin, insects, [insects])).toBe(false);
});

test('a member of the group cannot join it twice', () => {
  expect(canJoin(ant, insects, [insects])).toBe(false);
});

test('a concept that already spent the category elsewhere cannot join', () => {
  // ladybug was part of another group found for the same category, so it has
  // nothing left to contribute to this one.
  const elsewhere: Solution = { property: 'insect', concepts: ['ladybug', 'x', 'y'] };

  expect(canJoin(ladybug, insects, [insects, elsewhere])).toBe(false);
});

test('joining adds the concept to that group and spends its property', () => {
  const after = joinGroup([insects], 0, 'ladybug');

  expect(after[0].concepts).toEqual(['ant', 'bee', 'moth', 'ladybug']);
  expect(openProperties(ladybug, after)).toEqual(['small']);
});

test('joining leaves the other groups alone', () => {
  const others: Solution = { property: 'small', concepts: ['coin', 'ant', 'bee'] };
  const after = joinGroup([insects, others], 0, 'ladybug');

  expect(after[1]).toEqual(others);
  expect(after).toHaveLength(2);
});

test('joining never touches the list it was given', () => {
  const before: Solution[] = [insects];
  joinGroup(before, 0, 'ladybug');

  expect(before[0].concepts).toEqual(['ant', 'bee', 'moth']);
});
