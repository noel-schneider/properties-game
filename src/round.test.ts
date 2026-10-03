import { resolveGuess } from './round'
import { getAllConcepts } from './concepts'
import type { Solution } from './hand'

const pool = getAllConcepts();
const wordings = {
    biome: { label: 'biome', aliases: ['nature'] },
    trees: { label: 'trees', aliases: [] },
    vegetation: { label: 'vegetation', aliases: [] },
    water: { label: 'water', aliases: [] },
};

const forest = ['jungle', 'desert', 'forest'];

test('a group whose property is open for all three is accepted', () => {
    const outcome = resolveGuess(['jungle', 'desert', 'forest'], 'biome', { wordings, pool, found: [] });

    expect(outcome.correct).toBe(true);
    expect(outcome.property).toBe('biome');
});

test('a concept serves again, for another of its properties', () => {
    const first: Solution[] = [{ property: 'biome', concepts: forest }];
    const outcome = resolveGuess(['jungle', 'forest', 'orchard'], 'trees', { wordings, pool, found: first });

    expect(outcome.correct).toBe(true);
    expect(outcome.property).toBe('trees');
});

test('a property already spent by a member is refused', () => {
    const first: Solution[] = [{ property: 'biome', concepts: forest }];
    const outcome = resolveGuess(['jungle', 'desert', 'river'], 'biome', { wordings, pool, found: first });

    expect(outcome.correct).toBe(false);
});

test('the same property can be found again by three untouched concepts', () => {
    const first: Solution[] = [{ property: 'biome', concepts: forest }];
    const outcome = resolveGuess(['beach', 'glacier', 'mountain'], 'biome', { wordings, pool, found: first });

    expect(outcome.correct).toBe(true);
    expect(outcome.property).toBe('biome');
});

test('a category the three do not share is refused', () => {
    const outcome = resolveGuess(['jungle', 'desert', 'forest'], 'water', { wordings, pool, found: [] });

    expect(outcome.correct).toBe(false);
});

test('an accepted guess is added to what has been found', () => {
    const outcome = resolveGuess(forest, 'nature', { wordings, pool, found: [] });

    expect(outcome.found).toEqual([{ property: 'biome', concepts: forest }]);
});

test('a refused guess changes nothing', () => {
    const before: Solution[] = [{ property: 'biome', concepts: forest }];
    const outcome = resolveGuess(forest, 'water', { wordings, pool, found: before });

    expect(outcome.found).toBe(before);
});

test('a category one of the three has already used says so, rather than denying it', () => {
  // "Not a category these three share" would be a lie here: they do share it.
  // One of them has spent it, which is worth saying — the group that spent it
  // is already on the board for anyone to see, so nothing is given away.
  const found: Solution[] = [{ property: 'biome', concepts: forest }];
  const outcome = resolveGuess(forest, 'biome', { wordings, pool, found });

  expect(outcome.correct).toBe(false);
  expect(outcome.reason).toBe('spent');
});

test('three concepts with nothing in common get no such excuse', () => {
  const outcome = resolveGuess(['jungle', 'milk', 'piano'], 'biome', { wordings, pool, found: [] });

  expect(outcome.correct).toBe(false);
  expect(outcome.reason).toBe('no-match');
});
