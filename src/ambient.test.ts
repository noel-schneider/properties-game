import { CHORDS, chordAt, voicesOf } from './ambient'

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
