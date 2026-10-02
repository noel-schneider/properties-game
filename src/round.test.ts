import { resolveGuess } from './round'
import type { Hand } from './hand'
import type { Concept } from './types'

const jungle: Concept = { name: 'jungle', properties: ['biome', 'vegetation'] };
const desert: Concept = { name: 'desert', properties: ['biome', 'sand'] };
const forest: Concept = { name: 'forest', properties: ['biome', 'trees'] };
const piano: Concept = { name: 'piano', properties: ['music'] };
const guitar: Concept = { name: 'guitar', properties: ['music'] };
const drum: Concept = { name: 'drum', properties: ['music'] };
const pizza: Concept = { name: 'pizza', properties: ['food'] };

const hand: Hand = {
    solved: [],
    concepts: [jungle, desert, forest, piano, guitar, drum, pizza],
    solutions: [
        { property: 'biome', concepts: ['jungle', 'desert', 'forest'] },
        { property: 'music', concepts: ['piano', 'guitar', 'drum'] },
    ],
};

const wordings = {
    biome: { label: 'biome', aliases: ['nature'] },
    music: { label: 'music', aliases: [] },
    food: { label: 'food', aliases: [] },
};

test('a correct guess reports which group was found', () => {
    const outcome = resolveGuess(hand, ['jungle', 'desert', 'forest'], 'biome', { wordings });

    expect(outcome.correct).toBe(true);
    expect(outcome.property).toBe('biome');
});

test('a correct guess leaves the found concepts on the board', () => {
    const outcome = resolveGuess(hand, ['jungle', 'desert', 'forest'], 'biome', { wordings });
    const names = outcome.hand.concepts.map((c) => c.name);

    expect(names).toContain('jungle');
    expect(names).toContain('desert');
    expect(names).toContain('forest');
    expect(outcome.hand.concepts).toHaveLength(hand.concepts.length);
});

test('a correct guess records the group as found, with what it was', () => {
    const outcome = resolveGuess(hand, ['jungle', 'desert', 'forest'], 'biome', { wordings });

    expect(outcome.hand.solved).toEqual([
        { property: 'biome', concepts: ['jungle', 'desert', 'forest'] },
    ]);
});

test('a group found by its own wording is recorded under the same category', () => {
    const outcome = resolveGuess(hand, ['jungle', 'desert', 'forest'], 'nature', { wordings });

    expect(outcome.hand.solved[0].property).toBe('biome');
});

test('concepts already found cannot be counted twice', () => {
    const first = resolveGuess(hand, ['jungle', 'desert', 'forest'], 'biome', { wordings });
    const again = resolveGuess(first.hand, ['jungle', 'desert', 'forest'], 'biome', { wordings });

    expect(again.correct).toBe(false);
    expect(again.hand.solved).toHaveLength(1);
});

test('a solved group is no longer offered as a solution', () => {
    const outcome = resolveGuess(hand, ['jungle', 'desert', 'forest'], 'biome', { wordings });

    expect(outcome.hand.solutions.map((s) => s.property)).not.toContain('biome');
    expect(outcome.hand.solutions.map((s) => s.property)).toContain('music');
});

test('a correct guess scores a point', () => {
    const outcome = resolveGuess(hand, ['jungle', 'desert', 'forest'], 'nature', { wordings });

    expect(outcome.points).toBe(1);
});

test('a wrong guess leaves the hand untouched and scores nothing', () => {
    const outcome = resolveGuess(hand, ['jungle', 'desert', 'forest'], 'food', { wordings });

    expect(outcome.correct).toBe(false);
    expect(outcome.points).toBe(0);
    expect(outcome.hand).toEqual(hand);
});

test('naming a real category over the wrong concepts is still wrong', () => {
    const outcome = resolveGuess(hand, ['jungle', 'desert', 'pizza'], 'biome', { wordings });

    expect(outcome.correct).toBe(false);
    expect(outcome.hand).toEqual(hand);
});

test('a solution that can no longer be formed stops being offered', () => {
    // 'pizza' is a filler here, but a group locking 'piano' would strand music.
    const outcome = resolveGuess(hand, ['piano', 'guitar', 'drum'], 'music', { wordings });

    expect(outcome.hand.solutions.map((s) => s.property)).toEqual(['biome']);
});
