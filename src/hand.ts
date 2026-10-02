import { getNRandomElements } from './utils'
import type { Concept } from './types'

export interface Solution {
    property: string;
    concepts: string[];
}

export interface Hand {
    concepts: Concept[];
    solutions: Solution[];
}

export interface DealOptions {
    handSize: number;
    groupSize: number;
    /** How many solvable groups to aim for. Fewer are dealt if the pool cannot supply them. */
    maxGroups?: number;
}

/**
 * Groups the pool by property, keeping only the properties shared by enough
 * concepts to form a round.
 */
function findGroups(pool: Concept[], groupSize: number): Solution[] {
    const byProperty = new Map<string, string[]>();

    for (const concept of pool) {
        for (const property of concept.properties) {
            const names = byProperty.get(property) ?? [];
            names.push(concept.name);
            byProperty.set(property, names);
        }
    }

    return [...byProperty.entries()]
        .filter(([, names]) => names.length >= groupSize)
        .map(([property, names]) => ({ property, concepts: names }));
}

/**
 * Deals a hand that is guaranteed to be solvable.
 *
 * Dealing at random leaves most hands without a single complete group — with
 * the current data, roughly one hand in seven is playable. So the groups are
 * picked first and the rest of the hand is filled around them.
 */
export function dealHand(pool: Concept[], options: DealOptions): Hand {
    const { handSize, groupSize, maxGroups = 3 } = options;

    if (handSize < groupSize) {
        throw new Error(`A hand of ${handSize} cannot hold a group of ${groupSize}.`);
    }

    const candidates = findGroups(pool, groupSize);
    if (candidates.length === 0) {
        throw new Error(`No property is shared by ${groupSize} concepts in this pool.`);
    }

    const chosen: Solution[] = [];
    const picked = new Set<string>();

    // Groups are kept disjoint so that a selection never satisfies two answers
    // at once, which would make the feedback ambiguous.
    for (const candidate of getNRandomElements(candidates, candidates.length)) {
        if (chosen.length >= maxGroups) break;

        const available = candidate.concepts.filter((name) => !picked.has(name));
        if (available.length < groupSize) continue;

        const members = getNRandomElements(available, groupSize);
        if (picked.size + members.length > handSize) continue;

        members.forEach((name) => picked.add(name));
        chosen.push({ property: candidate.property, concepts: members });
    }

    const fillers = pool.filter((concept) => !picked.has(concept.name));
    const extras = getNRandomElements(fillers, handSize - picked.size);
    const concepts = [...pool.filter((c) => picked.has(c.name)), ...extras];

    return { concepts: getNRandomElements(concepts, concepts.length), solutions: chosen };
}
