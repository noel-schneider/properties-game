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
        name: 'First Light',
        description: 'Find your first category.',
        icon: '🌱',
        secret: false,
        earnedBy: ({ session }, event) => isWin(event) && session.finds >= 1,
    },
    {
        id: 'hat-trick',
        name: 'Hat-trick',
        description: 'Clear a whole board without a single wrong answer.',
        icon: '🎩',
        secret: false,
        earnedBy: ({ session }) => session.boardJustCleared && session.boardMistakes === 0,
    },
    {
        id: 'in-your-words',
        name: 'In Your Words',
        description: 'Have ten answers accepted in your own wording rather than the exact term.',
        icon: '💬',
        secret: false,
        earnedBy: ({ lifetime }) => lifetime.aliasAnswers >= 10,
    },
    {
        id: 'streak-of-five',
        name: 'Streak of Five',
        description: 'Find five categories in a row without a miss.',
        icon: '🔥',
        secret: false,
        earnedBy: ({ session }) => session.streak >= 5,
    },
    {
        id: 'collector',
        name: 'Collector',
        description: 'Find twenty different categories.',
        icon: '🗂️',
        secret: false,
        earnedBy: ({ lifetime }) => lifetime.propertiesFound.length >= 20,
    },
    {
        id: 'quickdraw',
        name: 'Quickdraw',
        description: 'Find a category within ten seconds of the board appearing.',
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
        name: 'Marathon',
        description: 'Find twenty-five categories in a single sitting.',
        icon: '🏃',
        secret: false,
        earnedBy: ({ session }) => session.finds >= 25,
    },
    {
        id: 'spotless',
        name: 'Spotless',
        description: 'Clear three boards in a row without a single wrong answer.',
        icon: '✨',
        secret: false,
        earnedBy: ({ session }) => session.cleanBoardsInARow >= 3,
    },
    {
        id: 'completionist',
        name: 'Completionist',
        description: 'Find every category in the game.',
        icon: '🏅',
        secret: false,
        earnedBy: ({ lifetime }) => lifetime.propertiesFound.length >= allProperties().length,
    },

    {
        id: 'second-guessing',
        name: 'Second Guessing',
        description: 'Pick and unpick the same concept ten times before committing to an answer.',
        icon: '🤔',
        secret: true,
        earnedBy: ({ session }, event) =>
            event.type === 'concept-toggled' && (session.toggleCounts[event.name] ?? 0) >= 10,
    },
    {
        id: 'scattershot',
        name: 'Scattershot',
        description: 'Get five answers wrong on the same board.',
        icon: '🎲',
        secret: true,
        earnedBy: ({ session }) => session.boardMistakes >= 5,
    },
    {
        id: 'big-net',
        name: 'Big Net',
        description: 'Answer correctly with eight or more concepts selected.',
        icon: '🕸️',
        secret: true,
        earnedBy: (_, event) => isWin(event) && event.type === 'guess' && event.selection.length >= 8,
    },
    {
        id: 'word-for-word',
        name: 'Word for Word',
        description: 'Name the exact term ten times, never once paraphrasing.',
        icon: '📖',
        secret: true,
        earnedBy: ({ lifetime }) => lifetime.exactAnswers >= 10 && lifetime.aliasAnswers === 0,
    },
    {
        id: 'and-yet',
        name: 'And Yet',
        description: 'Answer correctly straight after getting the same selection wrong.',
        icon: '🙃',
        secret: true,
        earnedBy: ({ session }) => session.redeemedLastMiss,
    },
    {
        id: 'night-owl',
        name: 'Night Owl',
        description: 'Play between two and four in the morning.',
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
