import { CATALOGUE } from './catalogue'
import { advance } from './progress'
import type { Achievement, GameEvent, Progress } from './types'

export { CATALOGUE } from './catalogue'
export { advance, emptyLifetime, emptyProgress } from './progress'
export type { Achievement, GameEvent, Lifetime, Progress } from './types'

export interface Recorded {
    progress: Progress;
    /** Earned by this very event, in catalogue order. Never already-held ones. */
    unlocked: Achievement[];
}

/**
 * Folds one event into the progress and reports what it just earned.
 *
 * An achievement is announced once and only once: the ids already held are
 * part of the lifetime record, so a predicate that stays true forever (every
 * later win still satisfies `first-light`) cannot announce itself twice.
 */
export function recordEvent(progress: Progress, event: GameEvent): Recorded {
    const advanced = advance(progress, event);
    const held = new Set(advanced.lifetime.unlocked);

    const unlocked = CATALOGUE.filter(
        (achievement) => !held.has(achievement.id) && achievement.earnedBy(advanced, event),
    );

    if (unlocked.length === 0) {
        return { progress: advanced, unlocked };
    }

    return {
        progress: {
            ...advanced,
            lifetime: {
                ...advanced.lifetime,
                unlocked: [...advanced.lifetime.unlocked, ...unlocked.map((a) => a.id)],
            },
        },
        unlocked,
    };
}
