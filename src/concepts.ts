import data from './concepts.json'
import aliasData from './property-aliases.json'
import { dealHand, type Hand } from './hand'
import type { Concept } from './types'
import type { PropertyAliases } from './guess'

export const CONCEPTS_PER_ROUND = 15;
export const CONCEPTS_PER_GROUP = 3;

const allConcepts: Concept[] = Object.entries(data as Record<string, string[]>)
    .map(([name, properties]) => ({ name, properties }));

export const propertyAliases: PropertyAliases = aliasData;

export function getAllConcepts(): Concept[] {
    return allConcepts;
}

export function dealRound(): Hand {
    return dealHand(allConcepts, {
        handSize: CONCEPTS_PER_ROUND,
        groupSize: CONCEPTS_PER_GROUP,
    });
}
