/**
 * When the music strikes a chord.
 *
 * The background follows the music by being told, not by listening to it: the
 * game writes the music, so the moment a chord lands and how big the orchestra
 * is are already known. An analyser reading the output sixty times a second
 * would buy nothing and cost a frame budget the settling board has already
 * spent.
 */
type Listener = (parts: number) => void;

const listeners = new Set<Listener>();

/** Subscribes, and hands back the way out. */
export function onChord(listener: Listener): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

/** Called by the player as each chord starts. */
export function chordStruck(parts: number): void {
    for (const listener of [...listeners]) {
        try {
            listener(parts);
        } catch {
            // One listener's bad day is not the music's, nor the game's.
        }
    }
}
