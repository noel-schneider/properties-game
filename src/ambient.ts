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

/**
 * The orchestra, in the order it arrives.
 *
 * Every instrument is scheduled inside the chord that is already being played,
 * at offsets from that one moment — not on timers of its own. One setTimeout
 * drives the whole piece however many voices are in it, which is what keeps a
 * five-part bed as cheap as a one-part one.
 */
export interface Layer {
    id: string;
    /** What this part plays over one chord. */
    play: (ctx: AudioContext, into: GainNode, at: number, chord: number[]) => void;
}

/** A plain voice: one oscillator, one envelope, gone when it is done. */
function voice(
    ctx: AudioContext,
    into: GainNode,
    at: number,
    hz: number,
    shape: OscillatorType,
    peak: number,
    attack: number,
    length: number,
    detune = 0,
): void {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(hz, at);
    oscillator.detune.setValueAtTime(detune, at);

    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(peak, at + attack);
    gain.gain.linearRampToValueAtTime(0, at + length);

    oscillator.connect(gain).connect(into);
    oscillator.start(at);
    oscillator.stop(at + length + 0.05);
}

export const LAYERS: Layer[] = [
    {
        // The bed itself: the chord, held.
        id: 'pad',
        play: (ctx, into, at, chord) => {
            for (const hz of voicesOf(chord)) {
                voice(ctx, into, at, hz, 'triangle', VOICE_GAIN,
                      CHORD_SECONDS * 0.35, CHORD_SECONDS, (Math.random() - 0.5) * 9);
            }
        },
    },
    {
        // A floor under it. One note, an octave down, slower in than the pad so
        // it is felt arriving rather than heard.
        id: 'bass',
        play: (ctx, into, at, chord) => {
            const root = ROOT * 2 ** ((chord[0] - 12) / 12);
            voice(ctx, into, at, root, 'sine', VOICE_GAIN * 1.6,
                  CHORD_SECONDS * 0.5, CHORD_SECONDS);
        },
    },
    {
        // Something moving at last: four plucked notes walking up the chord,
        // an octave above it, each gone in a second.
        id: 'pluck',
        play: (ctx, into, at, chord) => {
            chord.forEach((semitones, i) => {
                voice(ctx, into, at + 1.5 + i * 2.2, ROOT * 2 ** ((semitones + 12) / 12),
                      'triangle', VOICE_GAIN * 0.7, 0.02, 1.1);
            });
        },
    },
    {
        // Air over the top. An octave and a fifth up rather than two octaves:
        // the lowpass sits at 900 Hz, and two octaves would have put this part
        // on the wrong side of it, where it would have cost voices and been
        // all but inaudible.
        id: 'shimmer',
        play: (ctx, into, at, chord) => {
            for (const semitones of chord.slice(-2)) {
                voice(ctx, into, at, ROOT * 2 ** ((semitones + 19) / 12), 'sine',
                      VOICE_GAIN * 0.25, CHORD_SECONDS * 0.6, CHORD_SECONDS, 6);
            }
        },
    },
    {
        // The last to arrive and the slowest: a sawtooth swell under the
        // lowpass, which is where a string section lives.
        id: 'strings',
        play: (ctx, into, at, chord) => {
            // In the pad's own register, where a sawtooth under this lowpass
            // stops being a buzz and turns into bowed strings.
            for (const semitones of chord.slice(0, 3)) {
                voice(ctx, into, at, ROOT * 2 ** (semitones / 12), 'sawtooth',
                      VOICE_GAIN * 0.22, CHORD_SECONDS * 0.75, CHORD_SECONDS, -5);
            }
        },
    },
];

/** How many concepts a player finishes before the next instrument joins. */
export const LAYER_EVERY = 20;

/** How big the orchestra is at a given point in a game. */
export function layersFor(finished: number): number {
    return Math.max(1, Math.min(LAYERS.length, 1 + Math.floor(finished / LAYER_EVERY)));
}

/** How many parts are playing. Changed as a game goes on. */
let playing = 1;

export function setAmbientLayers(count: number): void {
    playing = Math.max(1, Math.min(LAYERS.length, Math.floor(count)));
}

let bus: GainNode | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let step = 0;

/** Whether the bed is running. */
export function ambientPlaying(): boolean {
    return bus !== null;
}

function playChord(ctx: AudioContext, into: GainNode): void {
    const chord = chordAt(step);
    const at = ctx.currentTime;

    // Everything this chord will do is scheduled now, at offsets from this one
    // moment. However many parts are playing, the cost in timers is the same.
    for (const layer of LAYERS.slice(0, playing)) layer.play(ctx, into, at, chord);
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
