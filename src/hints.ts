import type { Solution } from './hand'

/**
 * How long a nudge stays lit.
 *
 * Six and a half seconds: a player whose eyes are on the other side of the
 * board needs time to come back and still find it there, and a mark that
 * outstays that stops reading as an answer to the question they asked.
 *
 * There is no wait before it any more. The board used to speak up by itself
 * after forty-five seconds and every twenty-five after that; it is asked now,
 * which is the only version a player can read as help rather than as a lesson.
 */
export const HINT_SHOWN = 6_500;

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
    const members = group.concepts;
    // Which two of the three, rolled on by the step rather than by how many
    // times the groups have been round. Two groups on a board often share two
    // members — "drum, radio, bell" and "drum, radio, phone" — and taking the
    // first two of each would then point at the same pair twice running, which
    // reads as the board being stuck rather than the player.
    const first = members[step % members.length];
    const second = members[(step + 1) % members.length];

    return [first, second];
}
