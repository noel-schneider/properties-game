import { matchedProperty } from './guess'
import type { Wordings } from './guess'
import type { Hand } from './hand'

export interface RoundOptions {
    /** What each category is called in the language being played. */
    wordings: Wordings;
}

export interface Outcome {
    correct: boolean;
    /** The category that was found, when the guess was right. */
    property?: string;
    points: number;
    hand: Hand;
}

/**
 * Settles one guess.
 *
 * A found group stays on the board: its concepts are locked together and drawn
 * linked, so the player can see what they have worked out. Nothing is dealt in
 * its place — the board holds what it was dealt, and once every group has been
 * found there is a new one. A wrong answer changes nothing.
 */
export function resolveGuess(
    hand: Hand,
    selected: string[],
    guess: string,
    { wordings }: RoundOptions,
): Outcome {
    const locked = new Set(hand.solved.flatMap((group) => group.concepts));
    const chosen = hand.concepts.filter(
        (concept) => selected.includes(concept.name) && !locked.has(concept.name),
    );

    // A selection has to stand on its own: concepts already spoken for cannot
    // be counted towards a second group.
    if (chosen.length !== selected.length) {
        return { correct: false, points: 0, hand };
    }

    const property = matchedProperty(chosen, guess, wordings);
    if (property === undefined) {
        return { correct: false, points: 0, hand };
    }

    const found = { property, concepts: chosen.map((concept) => concept.name) };
    const nowLocked = new Set([...locked, ...found.concepts]);

    // A group needing a concept that has just been locked can never be formed,
    // so it stops being one of the board's answers.
    const solutions = hand.solutions.filter(
        (solution) =>
            solution.property !== property &&
            solution.concepts.every((name) => !nowLocked.has(name)),
    );

    return {
        correct: true,
        property,
        points: 1,
        hand: { ...hand, solutions, solved: [...hand.solved, found] },
    };
}
