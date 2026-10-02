import { donePropertiesOf, isFinished, isSpent, openProperties, unfinished } from './game'
import type { Solution } from './hand'
import type { Concept } from './types'

const jungle: Concept = { name: 'jungle', properties: ['biome', 'vegetation', 'trees'] };
const desert: Concept = { name: 'desert', properties: ['biome', 'sand'] };
const forest: Concept = { name: 'forest', properties: ['biome', 'trees'] };
const swamp: Concept = { name: 'swamp', properties: ['biome', 'vegetation', 'water'] };

const biome: Solution = { property: 'biome', concepts: ['jungle', 'desert', 'forest'] };
const trees: Solution = { property: 'trees', concepts: ['jungle', 'forest', 'swamp'] };

test('a concept carries its properties one at a time', () => {
  expect(donePropertiesOf('jungle', [biome])).toEqual(['biome']);
  expect(openProperties(jungle, [biome])).toEqual(['vegetation', 'trees']);
});

test('a concept can serve a second group, for a different property', () => {
  expect(donePropertiesOf('jungle', [biome, trees])).toEqual(['biome', 'trees']);
  expect(openProperties(jungle, [biome, trees])).toEqual(['vegetation']);
});

test('a group only spends the property it was found for', () => {
  // desert was in the biome group; its sand is untouched.
  expect(openProperties(desert, [biome])).toEqual(['sand']);
});

test('a concept is finished once every property it has is done', () => {
  expect(isFinished(forest, [biome])).toBe(false);
  expect(isFinished(forest, [biome, trees])).toBe(true);
});

test('a property found once can be found again with other concepts', () => {
  const again: Solution = { property: 'biome', concepts: ['swamp', 'tundra', 'savanna'] };

  expect(donePropertiesOf('swamp', [biome, again])).toEqual(['biome']);
});

test('the unfinished concepts are the ones still worth selecting', () => {
  const board = [jungle, desert, forest, swamp];

  expect(unfinished(board, [biome, trees]).map((c) => c.name)).toEqual(['jungle', 'desert', 'swamp']);
});

test('a concept never counted is untouched', () => {
  expect(donePropertiesOf('tundra', [biome, trees])).toEqual([]);
  expect(openProperties(swamp, [])).toEqual(['biome', 'vegetation', 'water']);
});

test('a concept whose last property has no companions left is spent', () => {
  const pool = [jungle, desert, forest, swamp];

  // 'sand' belongs to desert alone in this pool, so desert can never finish it.
  expect(isSpent(desert, [biome], pool)).toBe(true);
  // jungle still has vegetation, which swamp also has — but that is only two.
  expect(isSpent(jungle, [biome], pool)).toBe(true);
});

test('a concept with a property three of them still share is not spent', () => {
  const tundra: Concept = { name: 'tundra', properties: ['biome', 'vegetation'] };
  const pool = [jungle, desert, forest, swamp, tundra];

  expect(isSpent(jungle, [], pool)).toBe(false);
});

test('a finished concept is spent too', () => {
  expect(isSpent(forest, [biome, trees], [forest])).toBe(true);
});
