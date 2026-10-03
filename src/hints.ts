import type { Solution } from './hand'

/**
 * The nudge for a player who has stalled.
 *
 * How long the board waits before saying anything, how long it waits between
 * nudges after that, and how long a nudge stays lit. Forty-five seconds
 * because a player scanning twenty bubbles thinks for twenty without being
 * stuck, and a hint arriving mid-thought is noise rather than help.
 */
export const HINT_FIRST = 45_000;
export const HINT_AGAIN = 25_000;
export const HINT_SHOWN = 3_500;

/**
 * Two concepts of a trio that can be made right now, or null if none can.
 *
 * Two and not three. Which three go together is half of this game and naming
 * them is the other half; handing over a whole trio spends both at once, while
 * two leaves a player something to find and all of the naming.
 *
 * Each step picks a different pair — a different group where there is one, and
 * otherwise a different two of the same group. A nudge that repeats itself
 * reads as the board stuck rather than the player.
 */
export function hintPair(groups: Solution[], step: number): [string, string] | null {
    if (groups.length === 0) return null;

    const group = groups[step % groups.length];
    // Which two of the three, rolled on once the groups have been round once.
    const turn = Math.floor(step / groups.length);
    const members = group.concepts;
    const first = members[turn % members.length];
    const second = members[(turn + 1) % members.length];

    return [first, second];
}
