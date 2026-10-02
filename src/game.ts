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
 * Whether a concept has nothing left that can ever be found.
 *
 * Not the same as finished. A category of N concepts yields floor(N/3) groups
 * and strands the remainder, so a concept can be left holding a property that
 * no longer has two companions anywhere. It will never be completed, and
 * leaving it full size among the live ones only crowds the board.
 */
export function isSpent(concept: Concept, found: Solution[], pool: Concept[]): boolean {
    const open = openProperties(concept, found);
    if (open.length === 0) return true;

    return open.every((property) => {
        const companions = pool.filter(
            (other) => other.name !== concept.name && openProperties(other, found).includes(property),
        );
        return companions.length < 2;
    });
}
