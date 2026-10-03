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
export const CHORD_SECONDS = 13;
const OVERLAP_SECONDS = 4;

/** Quiet enough to think over. The chimes sit a good deal above this. */
const VOICE_GAIN = 0.035;

/**
 * A minor pentatonic, in semitones from the root.
 *
 * Every chord here is diatonic to A minor and this scale has no note that
 * grates against any of them, which is what lets one phrase be written and
 * played over all four without being transposed to fit.
 */
export const PENTATONIC = [0, 3, 5, 7, 10];

export interface Note {
    /** Seconds into the chord. */
    at: number;
    /** A step of the scale; past its length it carries on into the next octave. */
    degree: number;
}

/** The pitch of a scale degree, in semitones above the given octave. */
function pitchOf(degree: number, octaves: number): number {
    const steps = PENTATONIC.length;
    const within = ((degree % steps) + steps) % steps;
    const above = Math.floor(degree / steps);
    return PENTATONIC[within] + (above + octaves) * 12;
}

/**
 * The plucked line.
 *
 * Four written phrases rather than a walk up the chord: a note every couple of
 * seconds in pitch order is a scale exercise, and after two chords a player
 * hears the exercise rather than the music. These have uneven gaps, a rest in
 * the middle of each, and none of them ends where it started.
 */
const PLUCK_PHRASES: Note[][] = [
    [
        { at: 0.4, degree: 4 }, { at: 1.1, degree: 5 }, { at: 1.7, degree: 3 },
        { at: 3.2, degree: 4 }, { at: 6.4, degree: 2 }, { at: 7.3, degree: 1 },
    ],
    [
        { at: 0.9, degree: 2 }, { at: 1.4, degree: 4 }, { at: 2.6, degree: 6 },
        { at: 5.0, degree: 5 }, { at: 5.6, degree: 3 },
    ],
    [
        { at: 0.3, degree: 7 }, { at: 1.5, degree: 5 }, { at: 2.1, degree: 6 },
        { at: 2.8, degree: 4 }, { at: 6.0, degree: 2 }, { at: 8.2, degree: 3 },
    ],
    [
        { at: 1.2, degree: 3 }, { at: 2.0, degree: 2 }, { at: 2.4, degree: 4 },
        { at: 4.6, degree: 5 }, { at: 7.8, degree: 7 },
    ],
];

/**
 * The violin.
 *
 * Short strokes in twos and threes with silence between them, rather than one
 * held note — a bow changes direction, and that is the whole character of the
 * instrument. The groups move, so it reads as a phrase and not as a tremolo.
 */
const BOW_PHRASES: Note[][] = [
    [
        { at: 0.0, degree: 2 }, { at: 0.22, degree: 3 }, { at: 0.44, degree: 4 },
        { at: 3.4, degree: 5 }, { at: 3.62, degree: 4 },
        { at: 7.1, degree: 2 }, { at: 7.3, degree: 1 }, { at: 7.5, degree: 2 },
    ],
    [
        { at: 0.5, degree: 5 }, { at: 0.72, degree: 4 },
        { at: 2.9, degree: 3 }, { at: 3.1, degree: 4 }, { at: 3.32, degree: 5 },
        { at: 6.6, degree: 6 }, { at: 6.82, degree: 5 },
    ],
    [
        { at: 0.2, degree: 4 }, { at: 0.4, degree: 5 }, { at: 0.6, degree: 6 },
        { at: 4.0, degree: 4 }, { at: 4.2, degree: 3 },
        { at: 8.0, degree: 2 }, { at: 8.25, degree: 3 },
    ],
    [
        { at: 0.8, degree: 3 }, { at: 1.0, degree: 2 },
        { at: 3.8, degree: 4 }, { at: 4.0, degree: 5 }, { at: 4.22, degree: 6 },
        { at: 7.4, degree: 5 }, { at: 7.6, degree: 4 }, { at: 7.8, degree: 3 },
    ],
];

function phraseAt(phrases: Note[][], step: number): Note[] {
    const index = ((step % phrases.length) + phrases.length) % phrases.length;
    return phrases[index];
}

/** The plucked phrase for a chord. */
export function pluckPhrase(step: number): Note[] {
    return phraseAt(PLUCK_PHRASES, step);
}

/** The bowed phrase for a chord. */
export function bowPhrase(step: number): Note[] {
    return phraseAt(BOW_PHRASES, step);
}

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
    /** What this part plays over one chord, told which chord of the cycle it is. */
    play: (ctx: AudioContext, into: GainNode, at: number, chord: number[], step: number) => void;
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
        // Something moving at last: a written phrase, an octave above the bed,
        // each note gone in under two seconds.
        id: 'pluck',
        play: (ctx, into, at, _chord, step) => {
            for (const note of pluckPhrase(step)) {
                voice(ctx, into, at + note.at, ROOT * 2 ** (pitchOf(note.degree, 1) / 12),
                      'triangle', VOICE_GAIN * 1.4, 0.015, 1.9);
            }
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
        // The violin: short bowed strokes in twos and threes, sawtooth through
        // the lowpass, which is where that shape stops being a buzz. A quick
        // attack and a short tail is a bow changing direction; one held note
        // would be a synthesiser pad with a different name.
        id: 'strings',
        play: (ctx, into, at, _chord, step) => {
            for (const note of bowPhrase(step)) {
                voice(ctx, into, at + note.at, ROOT * 2 ** (pitchOf(note.degree, 1) / 12),
                      'sawtooth', VOICE_GAIN * 0.85, 0.045, 0.42, -5);
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

/** The chord in the air right now, so a part that joins can join it. */
let sounding: { ctx: AudioContext; into: GainNode; chord: number[]; step: number } | null = null;

/**
 * Sets how big the orchestra is.
 *
 * A part that has just been added starts on the chord already sounding rather
 * than on the next one. Waiting would mean up to nine seconds of silence after
 * the twentieth concept — long enough that the reward would not be read as a
 * reward at all, and long enough to make the bench useless for judging a part.
 */
export function setAmbientLayers(count: number): void {
    const wanted = Math.max(1, Math.min(LAYERS.length, Math.floor(count)));
    const joining = LAYERS.slice(playing, wanted);
    playing = wanted;

    if (!sounding || joining.length === 0) return;

    try {
        const { ctx, into, chord } = sounding;
        const { step: where } = sounding;
        for (const layer of joining) layer.play(ctx, into, ctx.currentTime, chord, where);
    } catch {
        // Music is a garnish.
    }
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
    sounding = { ctx, into, chord, step };
    for (const layer of LAYERS.slice(0, playing)) layer.play(ctx, into, at, chord, step);
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
    sounding = null;

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
