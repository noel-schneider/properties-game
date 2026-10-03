import type { Concept } from './types'
import type { Solution } from './hand'

export interface PropertyRow {
    property: string;
    /** Concepts placed in it so far. */
    have: number;
    /** Concepts in the whole game that belong in it. */
    total: number;
    complete: boolean;
}

/**
 * What has been named, and how much of each is still out there.
 *
 * Only what the player has already found. A category nobody has named is the
 * answer to a group still on the board, and listing it above that board for a
 * whole game would hand it over for free.
 *
 * The finished ones come first: the list is a record of wins before it is a
 * list of work left.
 */
export function propertyTally(found: Solution[], pool: Concept[]): PropertyRow[] {
    const size = new Map<string, number>();
    for (const concept of pool) {
        for (const property of concept.properties) {
            size.set(property, (size.get(property) ?? 0) + 1);
        }
    }

    return found
        .map((group) => {
            const total = size.get(group.property) ?? group.concepts.length;
            return {
                property: group.property,
                have: group.concepts.length,
                total,
                complete: group.concepts.length >= total,
            };
        })
        .sort((a, b) => {
            if (a.complete !== b.complete) return a.complete ? -1 : 1;
            return a.property.localeCompare(b.property);
        });
}
