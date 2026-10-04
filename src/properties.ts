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

    // One line per category, not one per group. A property can be found again
    // by different concepts — that is what lets the ones dealt later ever be
    // finished — so the same name turned up two and three times over, each
    // time with its own partial count.
    const placed = new Map<string, Set<string>>();
    for (const group of found) {
        const already = placed.get(group.property) ?? new Set<string>();
        for (const name of group.concepts) already.add(name);
        placed.set(group.property, already);
    }

    return [...placed.entries()]
        .map(([property, members]) => {
            const total = size.get(property) ?? members.size;
            return {
                property,
                have: members.size,
                total,
                complete: members.size >= total,
            };
        })
        .sort((a, b) => {
            if (a.complete !== b.complete) return a.complete ? -1 : 1;
            return a.property.localeCompare(b.property);
        });
}
