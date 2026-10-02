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

function audioContext(): AudioContext | null {
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
