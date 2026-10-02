import { dealHand } from './hand'
import type { Concept } from './types'

const concepts: Concept[] = [
    { name: 'jungle', properties: ['biome', 'vegetation'] },
    { name: 'desert', properties: ['biome', 'sand'] },
    { name: 'forest', properties: ['biome', 'trees'] },
    { name: 'igloo', properties: ['cold', 'house'] },
    { name: 'ice cream', properties: ['cold', 'food'] },
    { name: 'snow', properties: ['cold', 'white'] },
    { name: 'piano', properties: ['music'] },
    { name: 'guitar', properties: ['music'] },
    { name: 'pizza', properties: ['food'] },
    { name: 'rocket', properties: ['spacecraft'] },
];

test('a hand always contains at least one complete solvable group', () => {
    // Dealing at random from this pool would miss a full group most of the
    // time, so repeat enough that luck cannot explain a pass.
    for (let i = 0; i < 200; i++) {
        const hand = dealHand(concepts, { handSize: 6, groupSize: 3 });
        const names = hand.concepts.map((c) => c.name);

        expect(hand.solutions.length).toBeGreaterThanOrEqual(1);
        for (const solution of hand.solutions) {
            expect(solution.concepts).toHaveLength(3);
            for (const name of solution.concepts) {
                expect(names).toContain(name);
            }
        }
    }
});

test('a hand holds exactly the requested number of distinct concepts', () => {
    const hand = dealHand(concepts, { handSize: 6, groupSize: 3 });
    const names = hand.concepts.map((c) => c.name);

    expect(names).toHaveLength(6);
    expect(new Set(names).size).toBe(6);
});

test('every announced solution really shares its property', () => {
    for (let i = 0; i < 50; i++) {
        const hand = dealHand(concepts, { handSize: 6, groupSize: 3 });

        for (const solution of hand.solutions) {
            for (const name of solution.concepts) {
                const concept = hand.concepts.find((c) => c.name === name)!;
                expect(concept.properties).toContain(solution.property);
            }
        }
    }
});

test('a hand too small to fit a group is rejected rather than dealt unsolvable', () => {
    expect(() => dealHand(concepts, { handSize: 2, groupSize: 3 })).toThrow(
        /hand of 2 cannot hold a group of 3/i,
    );
});

test('a pool with no group large enough is rejected', () => {
    const poolWithoutGroups: Concept[] = [
        { name: 'piano', properties: ['music'] },
        { name: 'guitar', properties: ['music'] },
        { name: 'pizza', properties: ['food'] },
        { name: 'rocket', properties: ['spacecraft'] },
    ];

    expect(() => dealHand(poolWithoutGroups, { handSize: 4, groupSize: 3 })).toThrow(
        /no property is shared by 3 concepts/i,
    );
});
