import { audioContext } from './achievements/chime'

/**
 * The bed under the game: a slow chord drift, synthesised rather than bundled.
 *
 * No track to licence, no megabytes in the build, and nothing that loops — a
 * two-minute loop under a game somebody plays for an hour is the fastest way
 * to make them turn the sound off. What is here instead is four chords that
 * fade through one another forever, which never arrives anywhere and so is
 * never waited out.
 */

/** A2, the floor the whole bed sits on. */
const ROOT = 110;

/**
 * Four chords in A minor, in semitones from the root.
 *
 * Each shares at least one note with the next, the wrap back to the first
 * included. A progression where every voice moves at once reads as a change of
 * scene; one note held across the join is what turns a sequence into a drift.
 */
export const CHORDS: number[][] = [
    [0, 7, 12, 14],   // Am9
    [-4, 0, 7, 12],   // Fmaj7
    [5, 8, 12, 15],   // Dm7
    [3, 7, 10, 15],   // Cmaj7
];

/** The chord for a step, counting round forever. */
export function chordAt(step: number): number[] {
    const index = ((step % CHORDS.length) + CHORDS.length) % CHORDS.length;
    return CHORDS[index];
}

/** The frequencies of a chord, in hertz. */
export function voicesOf(chord: number[]): number[] {
    return chord.map((semitones) => ROOT * 2 ** (semitones / 12));
}

/** How long one chord takes, and how long before the next one starts under it. */
const CHORD_SECONDS = 13;
const OVERLAP_SECONDS = 4;

/** Quiet enough to think over. The chimes sit a good deal above this. */
const VOICE_GAIN = 0.035;

let bus: GainNode | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let step = 0;

/** Whether the bed is running. */
export function ambientPlaying(): boolean {
    return bus !== null;
}

function sound(ctx: AudioContext, into: GainNode, at: number, hz: number): void {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    // Triangle rather than sine: a little more to hold on to under the lowpass,
    // without the edge a sawtooth would bring.
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(hz, at);
    // A couple of cents off true, so two voices beat against each other slowly
    // instead of sitting dead still.
    oscillator.detune.setValueAtTime((Math.random() - 0.5) * 9, at);

    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(VOICE_GAIN, at + CHORD_SECONDS * 0.35);
    gain.gain.linearRampToValueAtTime(VOICE_GAIN * 0.7, at + CHORD_SECONDS * 0.6);
    gain.gain.linearRampToValueAtTime(0, at + CHORD_SECONDS);

    oscillator.connect(gain).connect(into);
    oscillator.start(at);
    oscillator.stop(at + CHORD_SECONDS + 0.1);
}

function playChord(ctx: AudioContext, into: GainNode): void {
    for (const hz of voicesOf(chordAt(step))) sound(ctx, into, ctx.currentTime, hz);
    step++;

    // The next one starts before this one has finished, so nothing ever lands
    // on silence.
    timer = setTimeout(() => {
        if (bus) playChord(ctx, into);
    }, (CHORD_SECONDS - OVERLAP_SECONDS) * 1000);
}

/**
 * Starts the bed. Idempotent, and silent about a browser that has no audio at
 * all — music is a garnish, and never a reason for a game not to run.
 */
export function startAmbient(): void {
    if (bus) return;

    const ctx = audioContext();
    if (!ctx) return;

    try {
        if (ctx.state === 'suspended') void ctx.resume();

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, ctx.currentTime);
        filter.Q.setValueAtTime(0.4, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        // Faded in over four seconds: music that arrives at full volume on a
        // click startles, which is the opposite of the point.
        gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 4);

        gain.connect(filter).connect(ctx.destination);
        bus = gain;
        playChord(ctx, gain);
    } catch {
        bus = null;
    }
}

/** Stops it, fading out rather than cutting. */
export function stopAmbient(): void {
    if (timer !== null) {
        clearTimeout(timer);
        timer = null;
    }
    if (!bus) return;

    const going = bus;
    bus = null;

    try {
        const ctx = audioContext();
        if (ctx) {
            going.gain.cancelScheduledValues(ctx.currentTime);
            going.gain.setValueAtTime(going.gain.value, ctx.currentTime);
            going.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
            setTimeout(() => going.disconnect(), 1500);
        } else {
            going.disconnect();
        }
    } catch {
        // Nothing here is worth interrupting a game for.
    }
}
