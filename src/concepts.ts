import data from './concepts.json'
import { getNRandomElements } from './utils'
import type { Concept } from './types'

const allConcepts: Concept[] = Object.entries(data as Record<string, string[]>)
    .map(([name, properties]) => ({ name, properties }));

export function getAllConcepts(): Concept[] {
    return allConcepts;
}

export function getRandomConcepts(n: number): Concept[] {
    return getNRandomElements(allConcepts, n);
}
