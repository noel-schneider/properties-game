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

export interface Note {
    /** Seconds into the chord. */
    at: number;
    /** Which note of the chord, carrying on into the octave above past the last. */
    tone: number;
}

/**
 * A note of the chord, in semitones from the root.
 *
 * Melody drawn from the harmony rather than from a scale beside it. The first
 * version wrote phrases in A minor pentatonic and played them over whichever
 * chord came round; every note was in key and almost none of them belonged to
 * what was sounding underneath, which is exactly what "picked at random"
 * sounds like.
 */
export function chordTone(chord: number[], index: number): number {
    const size = chord.length;
    const within = ((index % size) + size) % size;
    const octave = Math.floor(index / size);
    return chord[within] + octave * 12;
}

/**
 * The plucked line: one rhythm, two shapes.
 *
 * The rhythm never changes and the chord under it does, which is what makes a
 * listener hear a melody rather than notes — repetition is the whole of it.
 * Two shapes alternate so that four chords deep it is not a loop either.
 */
const PLUCK_SHAPES: number[][] = [
    [3, 2, 4, 3, 1, 2],
    [3, 4, 2, 5, 3, 1],
];

const PLUCK_RHYTHM = [0.3, 0.95, 1.6, 2.5, 5.4, 6.0];

/**
 * The strings: an ensemble swelling through the chord, with one voice moving
 * over the top of it.
 *
 * Short bowed strokes were tried first and came out as a buzz however they
 * were shaped — a sawtooth cut up into half-second pieces is a thing raw
 * oscillators are bad at, and no amount of filter sweeping rescued it. A slow
 * swell is what simple synthesis is actually good at: several voices a few
 * cents apart, arriving over four seconds, is a string section. The top note
 * is what keeps it from being another pad.
 */
const STRING_TOPS = [4, 5, 6, 5];

/** How long the ensemble takes to arrive, in seconds. */
export const STRING_SWELL = 4.5;

/** Which note of the chord the top voice takes, this time round. */
export function stringTop(step: number): number {
    return STRING_TOPS[((step % STRING_TOPS.length) + STRING_TOPS.length) % STRING_TOPS.length];
}

function phrase(shapes: number[][], rhythm: number[], step: number): Note[] {
    const shape = shapes[((step % shapes.length) + shapes.length) % shapes.length];
    return rhythm.map((at, i) => ({ at, tone: shape[i] }));
}

/** The plucked phrase for a chord. */
export function pluckPhrase(step: number): Note[] {
    return phrase(PLUCK_SHAPES, PLUCK_RHYTHM, step);
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
    play: (ctx: AudioContext, into: AudioNode, at: number, chord: number[], step: number) => void;
}

/** A plain voice: one oscillator, one envelope, gone when it is done. */
function voice(
    ctx: AudioContext,
    into: AudioNode,
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

/**
 * A bowed voice: slow in, slow out, and handed back so a vibrato can reach it.
 *
 * Sawtooth, because that is what has the harmonics a string has — but swelled
 * rather than struck. The same waveform cut into half-second strokes was the
 * buzz this replaced.
 */
function sustained(
    ctx: AudioContext,
    into: AudioNode,
    at: number,
    hz: number,
    peak: number,
    attack: number,
    cents = 0,
    length = CHORD_SECONDS,
): OscillatorNode {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(hz, at);
    oscillator.detune.setValueAtTime(cents, at);

    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(peak, at + attack);
    gain.gain.linearRampToValueAtTime(peak * 0.75, at + length * 0.75);
    gain.gain.linearRampToValueAtTime(0, at + length);

    oscillator.connect(gain).connect(into);
    oscillator.start(at);
    oscillator.stop(at + length + 0.05);
    return oscillator;
}

/** A part's own colour: one filter per chord, not one per note. */
function toned(ctx: AudioContext, into: AudioNode, hz: number): BiquadFilterNode {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(hz, ctx.currentTime);
    filter.Q.setValueAtTime(0.4, ctx.currentTime);
    filter.connect(into);
    return filter;
}

export const LAYERS: Layer[] = [
    {
        // The bed itself: the chord, held.
        id: 'pad',
        play: (ctx, into, at, chord) => {
            const tone = toned(ctx, into, 900);
            for (const hz of voicesOf(chord)) {
                voice(ctx, tone, at, hz, 'triangle', VOICE_GAIN,
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
            voice(ctx, toned(ctx, into, 300), at, root, 'sine', VOICE_GAIN * 1.6,
                  CHORD_SECONDS * 0.5, CHORD_SECONDS);
        },
    },
    {
        // Something moving at last: a written phrase, an octave above the bed,
        // each note gone in under two seconds.
        id: 'pluck',
        play: (ctx, into, at, chord, step) => {
            const tone = toned(ctx, into, 1600);
            for (const note of pluckPhrase(step)) {
                voice(ctx, tone, at + note.at, ROOT * 2 ** ((chordTone(chord, note.tone) + 12) / 12),
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
                      VOICE_GAIN * 0.3, CHORD_SECONDS * 0.6, CHORD_SECONDS, 6);
            }
        },
    },
    {
        // The violin: short bowed strokes in twos and threes, sawtooth through
        // the lowpass, which is where that shape stops being a buzz. A quick
        // attack and a short tail is a bow changing direction; one held note
        // would be a synthesiser pad with a different name.
        id: 'strings',
        play: (ctx, into, at, chord, step) => {
            // One vibrato for the whole section rather than one per voice: a
            // single oscillator feeding every detune costs two nodes a chord
            // and is what the ear reads as players rather than as a machine.
            const wobble = ctx.createOscillator();
            const depth = ctx.createGain();
            wobble.type = 'sine';
            wobble.frequency.setValueAtTime(4.6, at);
            // Shallow, and arriving after the note has spoken, the way a
            // player's hand does.
            depth.gain.setValueAtTime(0, at);
            depth.gain.linearRampToValueAtTime(5, at + STRING_SWELL);
            wobble.connect(depth);
            wobble.start(at);
            wobble.stop(at + CHORD_SECONDS);

            const tone = toned(ctx, into, 1300);

            // Each note doubled a few cents apart. Two voices beating slowly
            // against one another is the whole of what makes a section sound
            // like more than one player.
            for (const semitones of chord.slice(0, 3)) {
                for (const cents of [-7, 7]) {
                    const hz = ROOT * 2 ** (semitones / 12);
                    const part = sustained(ctx, tone, at, hz, VOICE_GAIN * 0.5, STRING_SWELL, cents);
                    depth.connect(part.detune);
                }
            }

            // And one voice over the top, which is what keeps this from being
            // a second pad.
            const lead = sustained(
                ctx, tone, at + 1.2,
                ROOT * 2 ** ((chordTone(chord, stringTop(step)) + 12) / 12),
                VOICE_GAIN * 0.55, STRING_SWELL, 0, CHORD_SECONDS - 2,
            );
            depth.connect(lead.detune);
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
    const before = playing;
    playing = wanted;

    if (!sounding || wanted === before) return;

    try {
        const { ctx, chord, step: where } = sounding;

        // Leaving: the notes a part has already scheduled run for the rest of
        // the chord, so without this a game started over kept its whole
        // orchestra for up to thirteen seconds. Its fader comes down instead.
        for (let i = wanted; i < before; i++) {
            const fader = channels[i];
            if (!fader) continue;
            fader.gain.cancelScheduledValues(ctx.currentTime);
            fader.gain.setValueAtTime(fader.gain.value, ctx.currentTime);
            fader.gain.linearRampToValueAtTime(0, ctx.currentTime + LEAVE_SECONDS);
        }

        // Joining: on the chord already sounding, not the next one.
        for (let i = before; i < wanted; i++) {
            const fader = channels[i];
            if (!fader) continue;
            fader.gain.cancelScheduledValues(ctx.currentTime);
            fader.gain.setValueAtTime(1, ctx.currentTime);
            LAYERS[i].play(ctx, fader, ctx.currentTime, chord, where);
        }
    } catch {
        // Music is a garnish.
    }
}

let bus: GainNode | null = null;
/** One fader per part, so a part can be taken out without waiting for a chord. */
let channels: GainNode[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let step = 0;

/** How long a part takes to leave. Quick, but not a cut. */
const LEAVE_SECONDS = 1.4;

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
    // Each part into its own fader, so one can be taken out mid-chord.
    for (let i = 0; i < playing; i++) LAYERS[i].play(ctx, channels[i] ?? into, at, chord, step);
    step++;

    // The next one starts before this one has finished, so nothing ever lands
    // on silence.
    timer = setTimeout(() => {
        if (bus) playChord(ctx, into);
    }, (CHORD_SECONDS - OVERLAP_SECONDS) * 1000);
}

// A way in for the end-to-end tests, which cannot play eighty concepts to
// reach the fifth instrument. Dropped from a built game along with the branch.
if (import.meta.env.DEV) {
    (globalThis as {
        __ambient?: {
            setAmbientLayers: (count: number) => void;
            faders: () => number[];
        };
    }).__ambient = {
        setAmbientLayers,
        faders: () => channels.map((fader) => fader.gain.value),
    };
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

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        // Faded in over four seconds: music that arrives at full volume on a
        // click startles, which is the opposite of the point.
        gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 4);

        gain.connect(ctx.destination);
        channels = LAYERS.map(() => {
            const fader = ctx.createGain();
            fader.gain.setValueAtTime(1, ctx.currentTime);
            fader.connect(gain);
            return fader;
        });

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
    channels = [];

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
