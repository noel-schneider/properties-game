import judgements from './difficulty.json'
import type { Concept } from './types'

/**
 * How hard it is to put a name to what three concepts share.
 *
 * Not how hard the category is to understand — *object* is a word every
 * child has, and nobody standing in front of a watch, a key and a bell says
 * it. What is measured here is the distance between seeing the three and
 * producing the word, which is the only difficulty this game has.
 *
 * Three levels rather than two. At two, everything merely ordinary — the
 * moon at night, a bicycle among vehicles — has to be filed as easy or as
 * hard, and both are wrong. The middle is where most of the three hundred
 * and seven live.
 */
export const LEVELS = ['easy', 'medium', 'hard'] as const;

export type Level = (typeof LEVELS)[number];

/**
 * The judgement is on the category, because that is where nearly all of it
 * lives: every member of *exploration* is a leap and every member of *food*
 * is not.
 */
export const CATEGORY_LEVELS = judgements.categories as Record<string, Level>;

/**
 * And on the pair, where a concept departs from its category.
 *
 * A rainbow is the one member of *colours* nobody has to think about; a cave
 * is the one *shelter* you would never call one. These are the exceptions,
 * and an exception that agrees with its category is a line nobody can tell
 * from a mistake — a test refuses those.
 */
export const PAIR_LEVELS = judgements.pairs as Record<string, Level>;

/** How hard this concept is to name through this category of its. */
export function levelOf(concept: string, property: string): Level {
    return PAIR_LEVELS[`${concept}|${property}`] ?? CATEGORY_LEVELS[property] ?? 'hard';
}

/**
 * How many pairs sit at each level.
 *
 * The number this was built for: a game that has quietly filled up with
 * abstractions shows it here before anybody has to play far enough to feel
 * it.
 */
export function spread(pool: Concept[]): Record<Level, number> {
    const counted = { easy: 0, medium: 0, hard: 0 };

    for (const concept of pool) {
        for (const property of concept.properties) counted[levelOf(concept.name, property)]++;
    }

    return counted;
}

/**
 * Whether a level is within reach of another.
 *
 * Levels are ordered, and most of what the deal wants to ask is "is this at
 * most that hard".
 */
export function atMost(level: Level, ceiling: Level): boolean {
    return LEVELS.indexOf(level) <= LEVELS.indexOf(ceiling);
}
