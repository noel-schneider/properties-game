import { CATALOGUE } from './catalogue'
import { emptyLifetime } from './progress'
import type { Lifetime } from './types'

export const STORAGE_KEY = 'properties-game:achievements';

function isNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * Reads the stored record, or an empty one.
 *
 * Nothing here is trusted: the record may be absent, may have been written by
 * an older version, or may have been edited by hand. And the accessor itself
 * throws in private browsing or when site data is blocked — a player who
 * cannot be remembered should still be able to play.
 */
export function loadLifetime(): Lifetime {
    let raw: string | null = null;

    try {
        raw = localStorage.getItem(STORAGE_KEY);
    } catch {
        return emptyLifetime();
    }

    if (raw === null) return emptyLifetime();

    let stored: unknown;
    try {
        stored = JSON.parse(raw);
    } catch {
        return emptyLifetime();
    }

    if (stored === null || typeof stored !== 'object') return emptyLifetime();

    const { unlocked, propertiesFound, aliasAnswers, exactAnswers } = stored as Record<string, unknown>;

    if (
        !isStringArray(unlocked) ||
        !isStringArray(propertiesFound) ||
        !isNumber(aliasAnswers) ||
        !isNumber(exactAnswers)
    ) {
        return emptyLifetime();
    }

    const known = new Set(CATALOGUE.map((achievement) => achievement.id));

    return {
        unlocked: unlocked.filter((id) => known.has(id)),
        propertiesFound,
        aliasAnswers,
        exactAnswers,
    };
}

/** Best effort. A record that cannot be written costs a reward, not the game. */
export function saveLifetime(lifetime: Lifetime): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lifetime));
    } catch {
        // Storage is full, blocked, or unavailable. Play continues.
    }
}
