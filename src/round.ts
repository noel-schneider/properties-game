import { matchedProperty } from './guess'
import { getNRandomElements } from './utils'
import type { PropertyAliases } from './guess'
import type { Hand } from './hand'
import type { Concept } from './types'

export interface RoundOptions {
    aliases: PropertyAliases;
    /** Every concept the game knows, to draw replacements from. */
    pool: Concept[];
}

export interface Outcome {
    correct: boolean;
    /** The category that was found, when the guess was right. */
    property?: string;
    points: number;
    hand: Hand;
}

/**
 * Settles one guess: on a correct answer the named concepts leave the hand,
 * fresh ones take their place, and the solved group stops being an answer.
 * A wrong answer changes nothing.
 */
export function resolveGuess(
    hand: Hand,
    selected: string[],
    guess: string,
    { aliases, pool }: RoundOptions,
): Outcome {
    const chosen = hand.concepts.filter((concept) => selected.includes(concept.name));
    const property = matchedProperty(chosen, guess, aliases);

    if (property === undefined) {
        return { correct: false, points: 0, hand };
    }

    const retired = new Set(chosen.map((concept) => concept.name));
    const kept = hand.concepts.filter((concept) => !retired.has(concept.name));

    // Replacements avoid everything the player has just been looking at, so a
    // retired concept never reappears in the same breath.
    const seen = new Set(hand.concepts.map((concept) => concept.name));
    const fresh = getNRandomElements(
        pool.filter((concept) => !seen.has(concept.name)),
        retired.size,
    );

    const concepts = [...kept, ...fresh];
    const present = new Set(concepts.map((concept) => concept.name));
    const solutions = hand.solutions.filter((solution) =>
        solution.concepts.every((name) => present.has(name)),
    );

    return {
        correct: true,
        property,
        points: 1,
        hand: { concepts: getNRandomElements(concepts, concepts.length), solutions },
    };
}
