import { checkGuess, sharedProperties } from './guess'
import type { Concept } from './types'

const jungle: Concept = { name: 'jungle', properties: ['biome', 'vegetation'] };
const desert: Concept = { name: 'desert', properties: ['biome', 'sand'] };
const forest: Concept = { name: 'forest', properties: ['biome', 'trees'] };
const pizza: Concept = { name: 'pizza', properties: ['food', 'dish'] };

const aliases = { biome: ['nature', 'ecosystem', 'landscape'] };

describe('sharedProperties', () => {
    test('returns the properties every concept has', () => {
        expect(sharedProperties([jungle, desert, forest])).toEqual(['biome']);
    });

    test('returns nothing when the concepts have no property in common', () => {
        expect(sharedProperties([jungle, pizza])).toEqual([]);
    });
});

describe('checkGuess', () => {
    test('accepts the exact shared property', () => {
        expect(checkGuess([jungle, desert, forest], 'biome', aliases)).toBe(true);
    });

    test('accepts an alias of the shared property', () => {
        expect(checkGuess([jungle, desert, forest], 'nature', aliases)).toBe(true);
    });

    test('ignores case, surrounding spaces and accents', () => {
        expect(checkGuess([jungle, desert, forest], '  BIÔME ', { biome: ['biôme'] })).toBe(true);
    });

    test('accepts the plural of the shared property', () => {
        expect(checkGuess([jungle, desert, forest], 'biomes', aliases)).toBe(true);
    });

    test('rejects a category the concepts do not share', () => {
        expect(checkGuess([jungle, desert, forest], 'food', aliases)).toBe(false);
    });

    test('rejects a property only some of the concepts have', () => {
        // 'sand' belongs to desert alone among these three.
        expect(checkGuess([jungle, desert, forest], 'sand', aliases)).toBe(false);
    });

    test('rejects an empty guess', () => {
        expect(checkGuess([jungle, desert, forest], '   ', aliases)).toBe(false);
    });

    test('rejects a guess when the concepts share nothing at all', () => {
        expect(checkGuess([jungle, pizza], 'biome', aliases)).toBe(false);
    });
});
