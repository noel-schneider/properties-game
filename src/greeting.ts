/**
 * Whether this player has been shown how to play.
 *
 * The rules are four gestures that the board cannot announce on its own, so
 * they are put in front of somebody arriving for the first time — once, and
 * never again. A player who cannot be remembered is greeted again next time,
 * which is a far better failure than refusing to start.
 */
export const GREETED_KEY = 'properties-game:greeted';

export function loadGreeted(): boolean {
    try {
        return localStorage.getItem(GREETED_KEY) === 'true';
    } catch {
        return false;
    }
}

export function saveGreeted(): void {
    try {
        localStorage.setItem(GREETED_KEY, 'true');
    } catch {
        // Nothing here is worth a crash.
    }
}
