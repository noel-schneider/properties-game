/**
 * Whether to skip the rules a player is shown on arrival.
 *
 * They are shown every visit. The game never writes this key: it exists for
 * the end-to-end suite, whose tests are about the board and would otherwise
 * each have to dismiss a card sitting over it. Naming it for what it is beats
 * dressing it up as a preference nobody can set.
 */
export const SKIP_KEY = 'properties-game:skip-intro';

export function skipIntro(): boolean {
    try {
        return localStorage.getItem(SKIP_KEY) === 'true';
    } catch {
        return false;
    }
}
