import {
    bowPhrase, CHORD_SECONDS, CHORDS, chordAt, LAYER_EVERY, LAYERS, layersFor,
    PENTATONIC, pluckPhrase, voicesOf,
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

test('a melody note is always in the scale, so nothing can clash with a chord', () => {
  // The four chords are all diatonic to A minor, and the pentatonic has no
  // note that grates against any of them. That is what lets a phrase be
  // written once and played over all four.
  for (let step = 0; step < 8; step++) {
    for (const note of [...pluckPhrase(step), ...bowPhrase(step)]) {
      const degree = ((note.degree % PENTATONIC.length) + PENTATONIC.length) % PENTATONIC.length;
      expect(PENTATONIC[degree]).toBeDefined();
    }
  }
});

test('every phrase fits inside the chord it is played over', () => {
  for (let step = 0; step < 8; step++) {
    for (const note of [...pluckPhrase(step), ...bowPhrase(step)]) {
      expect(note.at).toBeGreaterThanOrEqual(0);
      expect(note.at).toBeLessThan(CHORD_SECONDS - 1);
    }
  }
});

test('consecutive phrases differ, or four chords in it is a loop again', () => {
  const shapes = new Set<string>();
  for (let step = 0; step < 4; step++) {
    shapes.add(pluckPhrase(step).map((n) => `${n.at}:${n.degree}`).join(','));
  }
  expect(shapes.size).toBe(4);
});

test('the pluck phrase has a rhythm rather than a step', () => {
  // A note every N seconds up the chord is a scale exercise, not a melody.
  const gaps = new Set<number>();
  for (let step = 0; step < 4; step++) {
    const phrase = pluckPhrase(step);
    for (let i = 1; i < phrase.length; i++) {
      gaps.add(Math.round((phrase[i].at - phrase[i - 1].at) * 10) / 10);
    }
  }
  expect(gaps.size).toBeGreaterThan(2);
});

test('the violin comes in quick strokes, not in held notes', () => {
  for (let step = 0; step < 4; step++) {
    const phrase = bowPhrase(step);
    const quick = phrase.filter((note, i) => i > 0 && note.at - phrase[i - 1].at <= 0.3);

    expect(phrase.length).toBeGreaterThanOrEqual(5);
    expect(quick.length).toBeGreaterThanOrEqual(2);
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
