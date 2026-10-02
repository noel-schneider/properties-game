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
    concepts: [jungle, desert, forest, piano, guitar, drum, pizza],
    solutions: [
        { property: 'biome', concepts: ['jungle', 'desert', 'forest'] },
        { property: 'music', concepts: ['piano', 'guitar', 'drum'] },
    ],
};

const aliases = { biome: ['nature'] };
const spares: Concept[] = [
    { name: 'snow', properties: ['cold'] },
    { name: 'igloo', properties: ['cold'] },
    { name: 'glacier', properties: ['cold'] },
    { name: 'bread', properties: ['food'] },
    { name: 'soup', properties: ['food'] },
];
const pool: Concept[] = [...hand.concepts, ...spares];

test('a correct guess reports which group was found', () => {
    const outcome = resolveGuess(hand, ['jungle', 'desert', 'forest'], 'biome', { aliases, pool });

    expect(outcome.correct).toBe(true);
    expect(outcome.property).toBe('biome');
});

test('a correct guess retires the found concepts from the hand', () => {
    const outcome = resolveGuess(hand, ['jungle', 'desert', 'forest'], 'biome', { aliases, pool });
    const names = outcome.hand.concepts.map((c) => c.name);

    expect(names).not.toContain('jungle');
    expect(names).not.toContain('desert');
    expect(names).not.toContain('forest');
});

test('a correct guess keeps the hand at its original size', () => {
    const outcome = resolveGuess(hand, ['jungle', 'desert', 'forest'], 'biome', { aliases, pool });

    expect(outcome.hand.concepts).toHaveLength(hand.concepts.length);
});

test('a solved group is no longer offered as a solution', () => {
    const outcome = resolveGuess(hand, ['jungle', 'desert', 'forest'], 'biome', { aliases, pool });

    expect(outcome.hand.solutions.map((s) => s.property)).not.toContain('biome');
    expect(outcome.hand.solutions.map((s) => s.property)).toContain('music');
});

test('a correct guess scores a point', () => {
    const outcome = resolveGuess(hand, ['jungle', 'desert', 'forest'], 'nature', { aliases, pool });

    expect(outcome.points).toBe(1);
});

test('a wrong guess leaves the hand untouched and scores nothing', () => {
    const outcome = resolveGuess(hand, ['jungle', 'desert', 'forest'], 'food', { aliases, pool });

    expect(outcome.correct).toBe(false);
    expect(outcome.points).toBe(0);
    expect(outcome.hand).toEqual(hand);
});

test('naming a real category over the wrong concepts is still wrong', () => {
    const outcome = resolveGuess(hand, ['jungle', 'desert', 'pizza'], 'biome', { aliases, pool });

    expect(outcome.correct).toBe(false);
    expect(outcome.hand).toEqual(hand);
});

test('the replacement concepts are not already in the hand', () => {
    const outcome = resolveGuess(hand, ['piano', 'guitar', 'drum'], 'music', { aliases, pool });
    const names = outcome.hand.concepts.map((c) => c.name);

    expect(new Set(names).size).toBe(names.length);
});
