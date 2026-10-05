import { allProperties } from '../concepts'
import type { Achievement, GameEvent } from './types'

const QUICKDRAW_MS = 10_000;

/** Whether this event is a guess that was accepted. */
function isWin(event: GameEvent): boolean {
    return event.type === 'guess' && event.correct;
}

export const CATALOGUE: Achievement[] = [
    {
        id: 'first-light',
        icon: '🌱',
        secret: false,
        earnedBy: ({ session }, event) => isWin(event) && session.finds >= 1,
    },
    {
        id: 'hat-trick',
        icon: '🎩',
        secret: false,
        earnedBy: ({ lifetime }) => lifetime.conceptsFinished >= 1,
    },
    {
        id: 'in-your-words',
        icon: '💬',
        secret: false,
        earnedBy: ({ lifetime }) => lifetime.aliasAnswers >= 10,
    },
    {
        id: 'streak-of-five',
        icon: '🔥',
        secret: false,
        earnedBy: ({ session }) => session.streak >= 5,
    },
    {
        id: 'collector',
        icon: '🗂️',
        secret: false,
        earnedBy: ({ lifetime }) => lifetime.propertiesFound.length >= 20,
    },
    {
        id: 'quickdraw',
        icon: '⚡',
        secret: false,
        earnedBy: ({ session }, event) =>
            isWin(event) &&
            event.type === 'guess' &&
            session.boardDealtAt !== null &&
            event.at - session.boardDealtAt <= QUICKDRAW_MS,
    },
    {
        id: 'marathon',
        icon: '🏃',
        secret: false,
        earnedBy: ({ session }) => session.finds >= 25,
    },
    {
        id: 'spotless',
        icon: '✨',
        secret: false,
        earnedBy: ({ lifetime }) => lifetime.conceptsFinished >= 10,
    },
    {
        id: 'completionist',
        icon: '🏅',
        secret: false,
        earnedBy: ({ lifetime }) => lifetime.propertiesFound.length >= allProperties().length,
    },

    {
        id: 'second-guessing',
        icon: '🤔',
        secret: true,
        earnedBy: ({ session }, event) =>
            event.type === 'concept-toggled' && (session.toggleCounts[event.name] ?? 0) >= 10,
    },
    {
        id: 'scattershot',
        icon: '🎲',
        secret: true,
        earnedBy: ({ session }) => session.boardMistakes >= 5,
    },
    {
        id: 'big-net',
        icon: '🕸️',
        secret: true,
        earnedBy: (_, event) => isWin(event) && event.type === 'guess' && event.selection.length >= 8,
    },
    {
        id: 'word-for-word',
        icon: '📖',
        secret: true,
        earnedBy: ({ lifetime }) => lifetime.exactAnswers >= 10 && lifetime.aliasAnswers === 0,
    },
    {
        id: 'and-yet',
        icon: '🙃',
        secret: true,
        earnedBy: ({ session }) => session.redeemedLastMiss,
    },
    {
        // The drag is the one move the game never taught and never rewarded:
        // a lone concept dropped into a category already found.
        id: 'placed',
        icon: '🧲',
        secret: false,
        earnedBy: (_, event) =>
            isWin(event) && event.type === 'guess' && event.selection.length === 1,
    },
    {
        id: 'well-grown',
        icon: '🌳',
        secret: false,
        earnedBy: (_, event) =>
            isWin(event) && event.type === 'guess' && (event.groupSize ?? 0) >= 6,
    },
    {
        id: 'streak-of-ten',
        icon: '🌋',
        secret: false,
        earnedBy: ({ session }) => session.streak >= 10,
    },
    {
        // The counter of categories found does not move for this one, because
        // the category was already known — so something ought to.
        id: 'deja-vu',
        icon: '🔁',
        secret: true,
        earnedBy: ({ lifetime }) => lifetime.repeats >= 1,
    },
    {
        id: 'night-owl',
        icon: '🦉',
        secret: true,
        earnedBy: (_, event) => {
            if (event.type === 'board-dealt' || event.type === 'guess') {
                const hour = new Date(event.at).getHours();
                return hour >= 2 && hour < 4;
            }
            return false;
        },
    },
];
