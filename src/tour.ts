import { skipIntro } from './greeting'
import { canJoin, joinGroup } from './join'
import { resolveGuess } from './round'
import type { Feedback } from './App'
import type { Wordings } from './guess'
import type { Solution } from './hand'
import type { Concept } from './types'

/**
 * Set once the tutorial has been played through or skipped.
 *
 * Remembered, unlike the rules card: the tutorial teaches two gestures by
 * having them done, and somebody who has done them once does not need to be
 * walked through them again — the card is there for reminding.
 */
export const TUTORIAL_KEY = 'properties-game:tutorial-done';

/** The three that obviously go together: insects, and animals besides. */
export const TRIO = ['bee', 'ant', 'ladybug'] as const;

/**
 * Three that make no trio with anything else on the board.
 *
 * Pairs are fine — mountain and snow are both cold, a bee and a piano both
 * make a sound — so long as there is no third. Two obvious decoys were turned
 * down for exactly that: a guitar would have made bee, piano and guitar all
 * "sound", and a cloud would have made bee, ladybug and cloud all airborne.
 * Either is a second right answer nobody is being taught to look for.
 */
export const DECOYS = ['piano', 'mountain', 'snow'] as const;

/**
 * What arrives once the trio is named, to be dragged into its group.
 *
 * An insect and an animal both, so it can join whichever of the two the
 * player named the group for.
 */
export const NEWCOMER = 'butterfly';

/** Whether to walk this player through the two gestures before the game. */
export function needsTutorial(groupsFound: number): boolean {
    // The end-to-end suite's way past the arrival cards, the tutorial included.
    if (skipIntro()) return false;
    // Somebody with a game under way already knows how to play it: the
    // tutorial arrived after they did.
    if (groupsFound > 0) return false;

    try {
        return localStorage.getItem(TUTORIAL_KEY) !== 'true';
    } catch {
        return false;
    }
}

export function markTutorialDone(): void {
    try {
        localStorage.setItem(TUTORIAL_KEY, 'true');
    } catch {
        // Nothing to do: it will be offered again next time, which is harmless.
    }
}

export interface Tour {
    board: string[];
    selected: string[];
    found: Solution[];
    feedback: Feedback;
    arriving: string[];
    finished: boolean;
}

export type TourStep = 'pick' | 'name' | 'drag' | 'done';

/** Trio and decoys interleaved, so the answer is not three bubbles in a row. */
export function startTour(): Tour {
    return {
        board: [TRIO[0], DECOYS[0], TRIO[1], DECOYS[1], TRIO[2], DECOYS[2]],
        selected: [],
        found: [],
        feedback: 'none',
        arriving: [],
        finished: false,
    };
}

export function stepOf(tour: Tour): TourStep {
    if (tour.finished) return 'done';
    if (tour.found.length > 0) return 'drag';
    if (tour.selected.length >= 3) return 'name';
    return 'pick';
}

export function toggle(tour: Tour, name: string): Tour {
    // Nothing more to pick once the group is found: what is left is a drag.
    if (tour.found.length > 0) return tour;

    const selected = tour.selected.includes(name)
        ? tour.selected.filter((n) => n !== name)
        : [...tour.selected, name];
    return { ...tour, selected, feedback: 'none' };
}

export function clearSelection(tour: Tour): Tour {
    return tour.selected.length === 0 ? tour : { ...tour, selected: [] };
}

/**
 * A typed answer, settled exactly as the game settles one.
 *
 * Whatever the three really share is accepted — insect or animal — rather
 * than only the word the instruction offers as an example: being told no for
 * a right answer would be the worst first lesson the game could give.
 */
export function answer(
    tour: Tour,
    guess: string,
    { wordings, concepts }: { wordings: Wordings; concepts: Concept[] },
): { tour: Tour; correct: boolean } {
    const outcome = resolveGuess(tour.selected, guess, { wordings, pool: concepts, found: tour.found });
    if (!outcome.correct) {
        return { tour: { ...tour, feedback: outcome.reason === 'spent' ? 'spent' : 'wrong' }, correct: false };
    }

    return {
        tour: {
            ...tour,
            found: outcome.found,
            selected: [],
            feedback: 'correct',
            board: [...tour.board, NEWCOMER],
            arriving: [NEWCOMER],
        },
        correct: true,
    };
}

/** A concept dropped onto a found group: right only for the newcomer. */
export function drop(
    tour: Tour,
    index: number,
    name: string,
    concepts: Concept[],
): { tour: Tour; correct: boolean } {
    const group = tour.found[index];
    const concept = concepts.find((c) => c.name === name);
    if (!group || !concept || !canJoin(concept, group, tour.found)) {
        return { tour: { ...tour, feedback: 'wrong' }, correct: false };
    }

    return {
        tour: {
            ...tour,
            found: joinGroup(tour.found, index, name),
            feedback: 'correct',
            arriving: [],
            finished: true,
        },
        correct: true,
    };
}
