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

    const { unlocked, propertiesFound, aliasAnswers, exactAnswers, conceptsFinished } =
        stored as Record<string, unknown>;

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
        // Added after the first records were written, so missing means none.
        conceptsFinished: isNumber(conceptsFinished) ? conceptsFinished : 0,
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

/**
 * The run tally, under its own key for the same reason as the sound
 * preference. It is persisted because the end of a run is reached across
 * sessions: a summary announcing "51 categories" beside "1 board" would be
 * counting two different things.
 */
export const RUN_KEY = 'properties-game:run';

export interface RunTally {
    boards: number;
    correct: number;
    wrong: number;
    bestStreak: number;
}

export function emptyRunStats(): RunTally {
    return { boards: 0, correct: 0, wrong: 0, bestStreak: 0 };
}

export function loadRunStats(): RunTally {
    let raw: string | null = null;

    try {
        raw = localStorage.getItem(RUN_KEY);
    } catch {
        return emptyRunStats();
    }

    if (raw === null) return emptyRunStats();

    try {
        const stored = JSON.parse(raw) as Record<string, unknown>;
        const { boards, correct, wrong, bestStreak } = stored;

        if (!isNumber(boards) || !isNumber(correct) || !isNumber(wrong) || !isNumber(bestStreak)) {
            return emptyRunStats();
        }

        return { boards, correct, wrong, bestStreak };
    } catch {
        return emptyRunStats();
    }
}

export function saveRunStats(tally: RunTally): void {
    try {
        localStorage.setItem(RUN_KEY, JSON.stringify(tally));
    } catch {
        // As above: a tally is not worth a crash.
    }
}

/**
 * The groups found so far. The board is rebuilt from these on load: which
 * concepts are on screen is presentation, what was found is the game.
 */
export const FOUND_KEY = 'properties-game:found';

export interface FoundGroup {
    property: string;
    concepts: string[];
}

export function loadFound(): FoundGroup[] {
    let raw: string | null = null;
    try {
        raw = localStorage.getItem(FOUND_KEY);
    } catch {
        return [];
    }
    if (raw === null) return [];

    try {
        const stored: unknown = JSON.parse(raw);
        if (!Array.isArray(stored)) return [];

        return stored.filter(
            (group): group is FoundGroup =>
                group !== null &&
                typeof group === 'object' &&
                typeof (group as FoundGroup).property === 'string' &&
                isStringArray((group as FoundGroup).concepts),
        );
    } catch {
        return [];
    }
}

export function saveFound(found: FoundGroup[]): void {
    try {
        localStorage.setItem(FOUND_KEY, JSON.stringify(found));
    } catch {
        // As elsewhere: losing a record is a lost reward, not a crash.
    }
}
