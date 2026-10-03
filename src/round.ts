import { matchedProperty } from './guess'
import { openProperties } from './game'
import type { Wordings } from './guess'
import type { Solution } from './hand'
import type { Concept } from './types'

export interface RoundOptions {
    /** What each category is called in the language being played. */
    wordings: Wordings;
    /** Every concept the game knows. */
    pool: Concept[];
    /** Every group found so far. */
    found: Solution[];
}

/** Why a guess was refused, when it was. */
export type Refusal = 'no-match' | 'spent';

export interface Outcome {
    correct: boolean;
    /**
     * Only on a refusal.
     *
     * The two are worth telling apart. "Not a category these three share" is a
     * lie when one of them has simply used it up already — and saying so gives
     * nothing away, because the group that used it is drawn on the board for
     * anyone to look at.
     */
    reason?: Refusal;
    /** The category that was found, when the guess was right. */
    property?: string;
    points: number;
    /** What has been found, with this guess added when it was right. */
    found: Solution[];
}

/**
 * Settles one guess.
 *
 * The three concepts must share a property that is still **open for every one
 * of them**. A property one of them has already been used for cannot be used
 * again by that one: it would advance nothing, and the point of the game is
 * that each object has several properties to work through.
 *
 * The same property may be found over and over by different concepts, which is
 * what lets concepts dealt later ever be finished.
 */
export function resolveGuess(
    selected: string[],
    guess: string,
    { wordings, pool, found }: RoundOptions,
): Outcome {
    const byName = new Map(pool.map((concept) => [concept.name, concept]));
    const chosen = selected.map((name) => byName.get(name)).filter((c): c is Concept => !!c);

    if (chosen.length !== selected.length) {
        return { correct: false, reason: 'no-match', points: 0, found };
    }

    // Only the properties none of them has spent are on the table.
    const open = chosen.map((concept) => ({
        name: concept.name,
        properties: openProperties(concept, found),
    }));

    const property = matchedProperty(open, guess, wordings);
    if (property === undefined) {
        // Asked again with nothing held back: if the word matches now, the
        // three do share it and one of them has spent it.
        const all = chosen.map((concept) => ({ name: concept.name, properties: concept.properties }));
        const spent = matchedProperty(all, guess, wordings) !== undefined;

        return { correct: false, reason: spent ? 'spent' : 'no-match', points: 0, found };
    }

    return {
        correct: true,
        property,
        points: 1,
        found: [...found, { property, concepts: selected }],
    };
}
