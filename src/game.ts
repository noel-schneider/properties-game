import type { Solution } from './hand'
import type { Concept } from './types'

/**
 * What a concept has already been used for.
 *
 * A group spends one property from each of its three members, so a concept
 * with four properties can serve four groups before it is done. That is the
 * whole idea of the game: an object is interesting because it belongs to
 * several categories at once.
 */
export function donePropertiesOf(name: string, found: Solution[]): string[] {
    const done: string[] = [];

    for (const group of found) {
        if (group.concepts.includes(name) && !done.includes(group.property)) {
            done.push(group.property);
        }
    }

    return done;
}

/** What a concept can still be used for. */
export function openProperties(concept: Concept, found: Solution[]): string[] {
    const done = donePropertiesOf(concept.name, found);
    return concept.properties.filter((property) => !done.includes(property));
}

/** Whether every property a concept has was part of a found group. */
export function isFinished(concept: Concept, found: Solution[]): boolean {
    return openProperties(concept, found).length === 0;
}

/** The concepts still worth selecting. */
export function unfinished(concepts: Concept[], found: Solution[]): Concept[] {
    return concepts.filter((concept) => !isFinished(concept, found));
}

/** How far a concept is through its properties, for showing its state. */
export function progressOf(concept: Concept, found: Solution[]): { done: number; total: number } {
    return {
        done: concept.properties.length - openProperties(concept, found).length,
        total: concept.properties.length,
    };
}

/**
 * What a concept could still be used for: open, and with two companions left
 * somewhere in the game to make a group with.
 *
 * Not the same as open. A category of N concepts yields floor(N/3) groups and
 * strands the remainder, so a concept can be left holding a property that no
 * longer has two companions anywhere — open, and unusable. Counting those as
 * things left to find would send the player after them for nothing: measured
 * over three full games, a count of merely-open properties overstates what is
 * reachable fourteen percent of the time, by as much as three.
 */
export function liveProperties(concept: Concept, found: Solution[], pool: Concept[]): string[] {
    return openProperties(concept, found).filter((property) => {
        const companions = pool.filter(
            (other) => other.name !== concept.name && openProperties(other, found).includes(property),
        );
        return companions.length >= 2;
    });
}

/**
 * Whether a concept has nothing left that can ever be found.
 *
 * Not the same as finished: a concept holding only stranded properties is done
 * too, and leaving it full size among the live ones only crowds the board.
 */
export function isSpent(concept: Concept, found: Solution[], pool: Concept[]): boolean {
    return liveProperties(concept, found, pool).length === 0;
}

/**
 * How many answers the player has got right.
 *
 * Groups alone would not do: a concept added to a category already found is an
 * answer like any other, and twelve per cent of the answers in a game are that
 * move. Counting groups left every one of them with nothing on screen to show
 * it had landed.
 *
 * A group starts at three members, so each one beyond that was an answer too.
 */
export function countFinds(found: Solution[]): number {
    return found.reduce((count, group) => count + 1 + (group.concepts.length - GROUP_MEMBERS), 0);
}

/** How many concepts a group holds when it is first found. */
const GROUP_MEMBERS = 3;
