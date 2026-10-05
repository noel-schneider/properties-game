/**
 * Where a player who wants to chip in is sent.
 *
 * The one thing to fill in. It is a Ko-fi page, which is public by design —
 * nothing here touches a payment, a card or a bank: the player leaves for a
 * page Ko-fi hosts, and comes back if they feel like it.
 */
export const SUPPORT_URL = 'https://ko-fi.com/noeldesv';

/** Whose game this is. The byline leads here. */
export const PORTFOLIO_URL = 'https://www.noel-schneider.eu';

/**
 * How many right answers before the game mentions it, once.
 *
 * Measured over a whole game, which is about a hundred and fourteen answers.
 * Thirty is roughly a quarter of the way in: past the opening rush, where a
 * player has not yet been given anything worth thanking anyone for, and a long
 * way short of the end screen, which does its own asking.
 *
 * The two obvious alternatives were measured and dropped. Five achievements
 * land by the tenth answer — far too early. Ten achievements land by the
 * hundred and first, which is the end screen's own moment. And fifty bubbles
 * on the board arrives at about the right time but measures the board rather
 * than the player, who cannot see it and did not do it.
 */
export const ASK_AFTER = 30;

export const SUPPORT_KEY = 'properties-game:support';

export interface SupportState {
    /** Right answers this player has given, all sittings counted. */
    finds: number;
    /** Whether they have been asked before. */
    asked: boolean;
}

/**
 * Whether to mention it now.
 *
 * Once, ever — not once per sitting and not every thirty answers. A game runs
 * to a hundred and fourteen answers, so asking on a count alone would mean
 * asking four times in one evening, which is the thing nobody wants.
 */
export function worthAsking({ finds, asked }: SupportState): boolean {
    return !asked && finds >= ASK_AFTER;
}

/** Whether this player has already been asked. Never throws, never blocks play. */
export function loadAsked(): boolean {
    try {
        return localStorage.getItem(SUPPORT_KEY) === 'asked';
    } catch {
        return false;
    }
}

export function saveAsked(): void {
    try {
        localStorage.setItem(SUPPORT_KEY, 'asked');
    } catch {
        // A player who cannot be remembered is asked again next time. Still
        // better than refusing to run.
    }
}
