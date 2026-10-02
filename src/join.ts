import { openProperties } from './game'
import type { Solution } from './hand'
import type { Concept } from './types'

/**
 * Whether a concept can be added to a category that has already been found.
 *
 * Measured over a full game, every dead end in this game is of exactly this
 * shape: a concept left holding a property that no longer has two companions
 * anywhere — and in every case that property had already been found by some
 * other trio. Sixty-five such slots out of three hundred and eighty, none of
 * them on a category nobody had worked out. Letting one concept join an
 * existing group is what clears them.
 *
 * The one condition is that the concept still has that property to spend.
 * `openProperties` already excludes anything used in any group, so a member of
 * this group, or of another group found for the same category, is turned away
 * by the same check.
 */
export function canJoin(concept: Concept, group: Solution, found: Solution[]): boolean {
    return openProperties(concept, found).includes(group.property);
}

/** Adds a concept to a found group, leaving the list it was given untouched. */
export function joinGroup(found: Solution[], index: number, name: string): Solution[] {
    return found.map((group, i) =>
        i === index ? { ...group, concepts: [...group.concepts, name] } : group,
    );
}
