import data from './concepts.json'
import { dealHand, type Hand } from './hand'
import type { Concept } from './types'

export const CONCEPTS_PER_ROUND = 15;
export const CONCEPTS_PER_GROUP = 3;

const allConcepts: Concept[] = Object.entries(data as Record<string, string[]>)
    .map(([name, properties]) => ({ name, properties }));

export function getAllConcepts(): Concept[] {
    return allConcepts;
}

export function dealRound(found: string[] = []): Hand {
    return dealHand(allConcepts, {
        handSize: CONCEPTS_PER_ROUND,
        groupSize: CONCEPTS_PER_GROUP,
        found,
    });
}

/** Every category that can ever be an answer. The goal of a full run. */
export function allProperties(): string[] {
    return [...new Set(allConcepts.flatMap((concept) => concept.properties))];
}
