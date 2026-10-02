import type { Concept } from './types'

export type PropertyAliases = Record<string, string[]>;

/**
 * Folds a written answer down to a shape worth comparing: no case, no accents,
 * no stray spaces, no trailing plural. The player is answering in prose, and
 * "Biomes" is the same answer as "biome".
 */
function normalize(text: string): string {
    const folded = text
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/\s+/g, ' ');

    return folded.endsWith('s') ? folded.slice(0, -1) : folded;
}

/** The properties every one of these concepts has. */
export function sharedProperties(concepts: Concept[]): string[] {
    if (concepts.length === 0) return [];

    const [first, ...rest] = concepts;
    return first.properties.filter((property) =>
        rest.every((concept) => concept.properties.includes(property)),
    );
}

/**
 * Whether the written answer names a property that all the selected concepts
 * share, accepting the aliases declared for that property.
 */
export function checkGuess(
    concepts: Concept[],
    guess: string,
    aliases: PropertyAliases,
): boolean {
    const answer = normalize(guess);
    if (answer === '') return false;

    return sharedProperties(concepts).some((property) =>
        [property, ...(aliases[property] ?? [])].some((accepted) => normalize(accepted) === answer),
    );
}
