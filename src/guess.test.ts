import { checkGuess, isExactLabel, matchedProperty, sharedProperties } from './guess'
import type { Concept } from './types'

const jungle: Concept = { name: 'jungle', properties: ['biome', 'vegetation'] };
const desert: Concept = { name: 'desert', properties: ['biome', 'sand'] };
const forest: Concept = { name: 'forest', properties: ['biome', 'trees'] };
const pizza: Concept = { name: 'pizza', properties: ['food', 'dish'] };

const english = { biome: { label: 'biome', aliases: ['nature', 'ecosystem'] }, food: { label: 'food', aliases: [] }, sand: { label: 'sand', aliases: [] } };
const french = { biome: { label: 'nature', aliases: ['biome', 'écosystème'] } };

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
        expect(checkGuess([jungle, desert, forest], 'biome', english)).toBe(true);
    });

    test('accepts an alias of the shared property', () => {
        expect(checkGuess([jungle, desert, forest], 'nature', english)).toBe(true);
    });

    test('ignores case, surrounding spaces and accents', () => {
        expect(checkGuess([jungle, desert, forest], '  BIÔME ', { biome: { label: 'biome', aliases: ['biôme'] } })).toBe(true);
    });

    test('accepts the plural of the shared property', () => {
        expect(checkGuess([jungle, desert, forest], 'biomes', english)).toBe(true);
    });

    test('rejects a category the concepts do not share', () => {
        expect(checkGuess([jungle, desert, forest], 'food', english)).toBe(false);
    });

    test('rejects a property only some of the concepts have', () => {
        // 'sand' belongs to desert alone among these three.
        expect(checkGuess([jungle, desert, forest], 'sand', english)).toBe(false);
    });

    test('rejects an empty guess', () => {
        expect(checkGuess([jungle, desert, forest], '   ', english)).toBe(false);
    });

    test('rejects a guess when the concepts share nothing at all', () => {
        expect(checkGuess([jungle, pizza], 'biome', english)).toBe(false);
    });
});


describe('answering in another language', () => {
    test('accepts the category under its French name', () => {
        expect(checkGuess([jungle, desert, forest], 'nature', french)).toBe(true);
    });

    test('still reports the same category whichever language names it', () => {
        expect(matchedProperty([jungle, desert, forest], 'nature', french)).toBe('biome');
        expect(matchedProperty([jungle, desert, forest], 'biome', english)).toBe('biome');
    });

    test('the exact term is the one in the language being played', () => {
        expect(isExactLabel('biome', 'nature', french)).toBe(true);
        expect(isExactLabel('biome', 'biome', french)).toBe(false);
        expect(isExactLabel('biome', 'biome', english)).toBe(true);
    });
});
