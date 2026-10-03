import type { GameEvent, Lifetime, Progress } from './types'

export function emptyLifetime(): Lifetime {
    return { unlocked: [], conceptsFinished: 0, propertiesFound: [], repeats: 0, aliasAnswers: 0, exactAnswers: 0 };
}

export function emptyProgress(lifetime: Lifetime = emptyLifetime()): Progress {
    return {
        lifetime,
        session: {
            finds: 0,
            streak: 0,
            boardMistakes: 0,
            boardFinds: 0,
            boardGroups: 0,
            cleanBoardsInARow: 0,
            boardDealtAt: null,
            toggleCounts: {},
            lastWrongSelection: null,
            boardJustCleared: false,
            redeemedLastMiss: false,
        },
    };
}

function sameSelection(a: string[] | null, b: string[]): boolean {
    if (a === null || a.length !== b.length) return false;
    const left = [...a].sort();
    const right = [...b].sort();
    return left.every((name, i) => name === right[i]);
}

/**
 * Folds one event into the running progress.
 *
 * Everything an achievement needs is derived here, including the one-shot
 * flags (`boardJustCleared`, `redeemedLastMiss`) that describe what this very
 * event did. A predicate cannot see the previous progress, so anything about
 * the transition has to be written down as it happens.
 */
export function advance(progress: Progress, event: GameEvent): Progress {
    const { lifetime, session } = progress;
    const fresh = { ...session, boardJustCleared: false, redeemedLastMiss: false };

    if (event.type === 'board-dealt') {
        return {
            lifetime,
            session: {
                ...fresh,
                boardMistakes: 0,
                boardFinds: 0,
                boardGroups: event.groups,
                boardDealtAt: event.at,
                toggleCounts: {},
                lastWrongSelection: null,
            },
        };
    }

    if (event.type === 'concept-finished') {
        return {
            lifetime: { ...lifetime, conceptsFinished: lifetime.conceptsFinished + 1 },
            session: fresh,
        };
    }

    if (event.type === 'concept-toggled') {
        return {
            lifetime,
            session: {
                ...fresh,
                toggleCounts: {
                    ...fresh.toggleCounts,
                    [event.name]: (fresh.toggleCounts[event.name] ?? 0) + 1,
                },
            },
        };
    }

    if (!event.correct) {
        return {
            lifetime,
            session: {
                ...fresh,
                streak: 0,
                boardMistakes: fresh.boardMistakes + 1,
                toggleCounts: {},
                lastWrongSelection: event.selection,
            },
        };
    }

    const boardFinds = fresh.boardFinds + 1;
    const boardJustCleared = fresh.boardGroups > 0 && boardFinds >= fresh.boardGroups;
    const found = event.property;

    return {
        lifetime: {
            ...lifetime,
            propertiesFound:
                found && !lifetime.propertiesFound.includes(found)
                    ? [...lifetime.propertiesFound, found]
                    : lifetime.propertiesFound,
            // Counted rather than read back off the list, because the list has
            // already been added to by the time a predicate sees it.
            repeats: found && lifetime.propertiesFound.includes(found)
                ? lifetime.repeats + 1
                : lifetime.repeats,
            aliasAnswers: lifetime.aliasAnswers + (event.exactName ? 0 : 1),
            exactAnswers: lifetime.exactAnswers + (event.exactName ? 1 : 0),
        },
        session: {
            ...fresh,
            finds: fresh.finds + 1,
            streak: fresh.streak + 1,
            boardFinds,
            boardJustCleared,
            cleanBoardsInARow: boardJustCleared
                ? fresh.boardMistakes === 0
                    ? fresh.cleanBoardsInARow + 1
                    : 0
                : fresh.cleanBoardsInARow,
            toggleCounts: {},
            redeemedLastMiss: sameSelection(fresh.lastWrongSelection, event.selection),
            lastWrongSelection: null,
        },
    };
}
