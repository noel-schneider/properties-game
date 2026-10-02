import type { Concept } from './types'

/** What a single category is called, and what else is accepted for it. */
export interface Wording {
    label: string;
    aliases: string[];
}

/** Every category's wording, in one language. Keyed by the category's id. */
export type Wordings = Record<string, Wording>;

/**
 * Folds a written answer down to a shape worth comparing: no case, no accents,
 * no stray spaces, no trailing plural. The player is answering in prose, and
 * "Biomes" is the same answer as "biome".
 */
export function normalizeAnswer(text: string): string {
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
 * The shared property the written answer names, if any, accepting the aliases
 * declared for that property.
 */
export function matchedProperty(
    concepts: Concept[],
    guess: string,
    wordings: Wordings,
): string | undefined {
    const answer = normalizeAnswer(guess);
    if (answer === '') return undefined;

    return sharedProperties(concepts).find((property) => {
        const wording = wordings[property];
        if (!wording) return false;

        return [wording.label, ...wording.aliases].some(
            (accepted) => normalizeAnswer(accepted) === answer,
        );
    });
}

/**
 * Whether the answer was the category's own name rather than a paraphrase.
 *
 * The name is whichever the language being played uses, so a French player
 * answering "nature" has named it exactly, and one answering "biome" has not.
 */
export function isExactLabel(property: string, guess: string, wordings: Wordings): boolean {
    const label = wordings[property]?.label;
    return label !== undefined && normalizeAnswer(label) === normalizeAnswer(guess);
}

/**
 * Whether the written answer names a property that all the selected concepts
 * share.
 */
export function checkGuess(concepts: Concept[], guess: string, wordings: Wordings): boolean {
    return matchedProperty(concepts, guess, wordings) !== undefined;
}
