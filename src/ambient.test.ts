import {
    bowPhrase, CHORD_SECONDS, CHORDS, chordAt, chordTone, LAYER_EVERY, LAYERS,
    layersFor, pluckPhrase, voicesOf,
} from './ambient'

test('the progression comes back round, so a long game never runs out', () => {
  expect(chordAt(0)).toEqual(chordAt(CHORDS.length));
  expect(chordAt(CHORDS.length * 3 + 2)).toEqual(chordAt(2));
});

test('every chord is low, and none of it is shrill', () => {
  for (let step = 0; step < CHORDS.length; step++) {
    for (const hz of voicesOf(chordAt(step))) {
      // Under a game lasting an hour, anything up here turns into a dentist's
      // drill. The chimes live above this; the bed stays beneath them.
      expect(hz).toBeGreaterThan(80);
      expect(hz).toBeLessThan(560);
    }
  }
});

test('no two notes of a chord land on the same pitch', () => {
  for (let step = 0; step < CHORDS.length; step++) {
    const voices = voicesOf(chordAt(step));
    expect(new Set(voices).size).toBe(voices.length);
  }
});

test('consecutive chords share a note, which is what makes it drift', () => {
  // A progression where every voice moves at once reads as a change of scene.
  // One note held across the join is what turns a sequence into a drift.
  for (let step = 0; step < CHORDS.length; step++) {
    const here = new Set(voicesOf(chordAt(step)).map(Math.round));
    const next = voicesOf(chordAt(step + 1)).map(Math.round);
    expect(next.some((hz) => here.has(hz))).toBe(true);
  }
});

test('a lone pad at the start, one more instrument every twenty concepts', () => {
  expect(layersFor(0)).toBe(1);
  expect(layersFor(LAYER_EVERY - 1)).toBe(1);
  expect(layersFor(LAYER_EVERY)).toBe(2);
  expect(layersFor(LAYER_EVERY * 2)).toBe(3);
});

test('the orchestra is full by the end of a game, and never grows past it', () => {
  // A hundred concepts is the whole game, and the last instrument should
  // arrive before a player runs out of board rather than after.
  expect(layersFor(100)).toBe(LAYERS.length);
  expect(layersFor(10_000)).toBe(LAYERS.length);
});

test('nothing is ever asked of a voice that is not there', () => {
  for (const count of [0, 1, 20, 60, 100]) {
    const layers = LAYERS.slice(0, layersFor(count));
    expect(layers.length).toBeGreaterThan(0);
    for (const layer of layers) expect(typeof layer.play).toBe('function');
  }
});

test('every melody note is a note of the chord underneath it', () => {
  // The old phrases were written in a scale and played over whatever chord
  // came round, which is why they sounded picked at random: the line and the
  // harmony had nothing to do with each other.
  for (let step = 0; step < 8; step++) {
    const chord = chordAt(step);
    const inChord = new Set(chord.map((semitones) => ((semitones % 12) + 12) % 12));

    for (const note of [...pluckPhrase(step), ...bowPhrase(step)]) {
      const pitch = chordTone(chord, note.tone);
      expect(inChord.has(((pitch % 12) + 12) % 12)).toBe(true);
    }
  }
});

test('the line keeps its rhythm while the harmony moves under it', () => {
  // Repetition is what makes a listener hear a melody rather than notes. The
  // shape stays put; the chord it is drawn from does the changing.
  const rhythm = (step: number) => pluckPhrase(step).map((n) => n.at).join(',');

  expect(rhythm(0)).toBe(rhythm(1));
  expect(rhythm(1)).toBe(rhythm(2));
});

test('the line is not the same notes twice running', () => {
  // Same rhythm, but a phrase repeated note for note four chords deep is a
  // loop, which is the thing this whole bed exists to avoid.
  const sung = (step: number) =>
      pluckPhrase(step).map((n) => chordTone(chordAt(step), n.tone)).join(',');

  expect(sung(0)).not.toBe(sung(1));
});

test('every phrase fits inside the chord it is played over', () => {
  for (let step = 0; step < 8; step++) {
    for (const note of [...pluckPhrase(step), ...bowPhrase(step)]) {
      expect(note.at).toBeGreaterThanOrEqual(0);
      expect(note.at).toBeLessThan(CHORD_SECONDS - 1);
    }
  }
});

test('the violin bows in groups, at a speed a bow could manage', () => {
  for (let step = 0; step < 4; step++) {
    const phrase = bowPhrase(step);
    const gaps = phrase.slice(1).map((note, i) => note.at - phrase[i].at);

    // Close enough to belong to one gesture, far enough apart to be strokes
    // rather than a tremolo — which is what the last version sounded like.
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(0.4);
    expect(gaps.some((gap) => gap < 1)).toBe(true);
  }
});

test('neither part floods the chord, however sophisticated it gets', () => {
  // Voices are cheap but not free, and this is the thing that would make them
  // expensive without anyone noticing.
  for (let step = 0; step < 8; step++) {
    expect(pluckPhrase(step).length).toBeLessThanOrEqual(9);
    expect(bowPhrase(step).length).toBeLessThanOrEqual(10);
  }
});
