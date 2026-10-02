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

/**
 * The sound preference lives under its own key rather than inside the
 * achievement record. Adding a field to that record would make every copy
 * written by an earlier version fail validation and be discarded — which would
 * cost players the achievements they had already earned, to store a boolean.
 */
export const MUTED_KEY = 'properties-game:muted';

export function loadMuted(): boolean {
    try {
        return localStorage.getItem(MUTED_KEY) === 'true';
    } catch {
        return false;
    }
}

export function saveMuted(muted: boolean): void {
    try {
        localStorage.setItem(MUTED_KEY, String(muted));
    } catch {
        // Same bargain as the achievement record: a preference is not worth a crash.
    }
}
