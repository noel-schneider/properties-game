/**
 * The unlock sound, synthesised rather than bundled: no asset to source, no
 * licence to carry, no bytes in the build.
 *
 * Two rising notes with a soft bell envelope — A5 then E6. The context is
 * created on first use, by which point the player has clicked a bubble, so the
 * browser's autoplay gate is already satisfied.
 */

const NOTES = [
    { frequency: 880, startsAt: 0 },
    { frequency: 1318.5, startsAt: 0.09 },
];

const DECAY_SECONDS = 0.6;
const PEAK_GAIN = 0.18;

type ContextConstructor = typeof AudioContext;

let context: AudioContext | null = null;

/** The one context for the whole game: the chimes and the bed share it. */
export function audioContext(): AudioContext | null {
    if (context) return context;

    const Constructor: ContextConstructor | undefined =
        typeof AudioContext !== 'undefined'
            ? AudioContext
            : (globalThis as { webkitAudioContext?: ContextConstructor }).webkitAudioContext;

    if (!Constructor) return null;

    try {
        context = new Constructor();
        return context;
    } catch {
        return null;
    }
}

export function playUnlockChime(): void {
    const ctx = audioContext();
    if (!ctx) return;

    try {
        // A tab restored from the background leaves the context suspended.
        if (ctx.state === 'suspended') void ctx.resume();

        for (const { frequency, startsAt } of NOTES) {
            const at = ctx.currentTime + startsAt;
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, at);

            gain.gain.setValueAtTime(0, at);
            gain.gain.linearRampToValueAtTime(PEAK_GAIN, at + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0001, at + DECAY_SECONDS);

            oscillator.connect(gain).connect(ctx.destination);
            oscillator.start(at);
            oscillator.stop(at + DECAY_SECONDS);
        }
    } catch {
        // Audio is a garnish. Never let it interrupt play.
    }
}

/**
 * The notes a run of right answers climbs through.
 *
 * A pentatonic scale, chosen because no two of its notes clash: a player can
 * arrive at any point of a run from any other and it still sounds like music
 * rather than like a machine. A major scale would have a note in it that
 * grates against the one three steps down, and this is heard a hundred times
 * in a game.
 *
 * A4 up to C#6, which is high enough to feel like lift and low enough to stay
 * out of the part of the range that gets shrill.
 */
export const SCALE = [440, 493.88, 554.37, 659.25, 739.99, 880, 987.77, 1108.73];

/** The note for the nth right answer in a row, holding at the top. */
export function noteFor(step: number): number {
    return SCALE[Math.min(Math.max(step, 1), SCALE.length) - 1];
}

/** Quieter than the unlock chime, which is a reward rather than a reply. */
export const FOUND_GAIN = 0.09;
export const FOUND_DECAY = 0.32;

/**
 * The reply to a right answer.
 *
 * Short and soft on purpose. This plays on every find — a hundred times in a
 * full game — so anything with a tail or a bite to it would wear through long
 * before the game did. What makes it bearable, and then pleasant, is that it
 * climbs: a run you are building can be heard without looking.
 */
export function playFoundNote(step: number): void {
    const ctx = audioContext();
    if (!ctx) return;

    try {
        if (ctx.state === 'suspended') void ctx.resume();

        const at = ctx.currentTime;
        const frequency = noteFor(step);

        // The note, and a whisper of the octave above it for a little light.
        for (const [tone, share] of [[frequency, 1], [frequency * 2, 0.22]] as const) {
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(tone, at);

            gain.gain.setValueAtTime(0, at);
            gain.gain.linearRampToValueAtTime(FOUND_GAIN * share, at + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.0001, at + FOUND_DECAY);

            oscillator.connect(gain).connect(ctx.destination);
            oscillator.start(at);
            oscillator.stop(at + FOUND_DECAY);
        }
    } catch {
        // Audio is a garnish. Never let it interrupt play.
    }
}

/**
 * The third concept picked: a door unlocking, not a prize.
 *
 * Quieter and shorter than the note that answers a right guess, and below the
 * scale that note climbs, so the two can never be mistaken for one another.
 * This one says the box can be typed in now — which is worth saying, because
 * the box going from grey to live is easy to miss while the eyes are on the
 * board — and nothing more than that.
 */
export const READY_GAIN = 0.045;
export const READY_DECAY = 0.12;

/** Under the bottom of the scale a run climbs, so it is never heard as one. */
const READY_NOTE = 330;

export function playReadyTick(): void {
    const ctx = audioContext();
    if (!ctx) return;

    try {
        if (ctx.state === 'suspended') void ctx.resume();

        const at = ctx.currentTime;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(READY_NOTE, at);

        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(READY_GAIN, at + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + READY_DECAY);

        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start(at);
        oscillator.stop(at + READY_DECAY);
    } catch {
        // Audio is a garnish. Never let it interrupt play.
    }
}
