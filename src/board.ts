import { getNRandomElements } from './utils'
import { isFinished, isSpent, openProperties } from './game'
import type { Solution } from './hand'
import type { Concept } from './types'

export const GROUP_SIZE = 3;

/**
 * How many finished concepts stay on the board behind the active ones.
 *
 * They are kept because seeing your work pile up is the point, and bounded
 * because it cannot be all of them: with every concept and every tie on screen
 * at once the browser locks up outright — 126 bubbles and 312 lines rebuilt
 * sixty times a second is more than React will do. The oldest ones leave.
 */
export const FINISHED_KEPT = 20;

/**
 * The groups that could be found right now: a property still open for three
 * of the concepts on the board.
 *
 * A property may be found more than once, with different members — that is
 * what lets the concepts dealt later ever be finished — so what matters is not
 * whether the property has been found but whether it is open for these three.
 */
export function formableGroups(
    board: string[],
    pool: Concept[],
    found: Solution[],
): Solution[] {
    const byName = new Map(pool.map((concept) => [concept.name, concept]));
    const open = new Map<string, string[]>();

    for (const name of board) {
        const concept = byName.get(name);
        if (!concept) continue;

        for (const property of openProperties(concept, found)) {
            open.set(property, [...(open.get(property) ?? []), name]);
        }
    }

    return [...open.entries()]
        .filter(([, names]) => names.length >= GROUP_SIZE)
        .map(([property, names]) => ({ property, concepts: names.slice(0, GROUP_SIZE) }));
}

/** Concepts that could still be used for something, in a shuffled order. */
function stillUseful(pool: Concept[], found: Solution[], exclude: Set<string>): Concept[] {
    return getNRandomElements(
        pool.filter((concept) => !exclude.has(concept.name) && !isFinished(concept, found)),
        pool.length,
    );
}

/**
 * Tops the board up to the wanted number of unfinished concepts, and keeps
 * adding until something can actually be found.
 *
 * Both halves matter. A board of fifteen taken at random holds 2.4 formable
 * groups on average and sometimes none at all, so counting concepts is not
 * enough: the player would be left staring at a board with no answer and no
 * way to know it.
 */
export function refill(
    board: string[],
    pool: Concept[],
    found: Solution[],
    active: number,
): string[] {
    const byName = new Map(pool.map((concept) => [concept.name, concept]));
    const next = [...board];
    const present = new Set(next);

    const countActive = () =>
        next.filter((name) => {
            const concept = byName.get(name);
            return concept && !isFinished(concept, found);
        }).length;

    const candidates = stillUseful(pool, found, present);

    for (const concept of candidates) {
        if (countActive() >= active) break;
        next.push(concept.name);
        present.add(concept.name);
    }

    // Nothing to find yet: keep adding until there is, even past the wanted
    // number. A board that cannot be played is worse than a crowded one.
    for (const concept of candidates) {
        if (formableGroups(next, pool, found).length > 0) break;
        if (present.has(concept.name)) continue;
        next.push(concept.name);
        present.add(concept.name);
    }

    return trim(next, byName, found, pool);
}

/** Drops the finished concepts that have been sitting there longest. */
function trim(
    board: string[],
    byName: Map<string, Concept>,
    found: Solution[],
    pool: Concept[],
): string[] {
    const finished = board.filter((name) => {
        const concept = byName.get(name);
        return concept && isSpent(concept, found, pool);
    });
    if (finished.length <= FINISHED_KEPT) return board;

    const leaving = new Set(finished.slice(0, finished.length - FINISHED_KEPT));
    return board.filter((name) => !leaving.has(name));
}

/** A board to start from, guaranteed to hold something findable. */
export function openingBoard(pool: Concept[], active: number): string[] {
    const first = getNRandomElements(pool, active).map((concept) => concept.name);
    return refill(first, pool, [], active);
}
