import { noteFor, SCALE } from './chime'

test('a run climbs, so a streak sounds like one', () => {
  expect(noteFor(1)).toBeLessThan(noteFor(2));
  expect(noteFor(2)).toBeLessThan(noteFor(3));
});

test('it stops climbing rather than running off the top', () => {
  // Played a hundred times a game: past the scale it would leave the range a
  // person wants in their ears.
  expect(noteFor(SCALE.length + 5)).toBe(noteFor(SCALE.length));
});

test('a run that broke starts again from the bottom', () => {
  expect(noteFor(1)).toBe(SCALE[0]);
  expect(noteFor(0)).toBe(SCALE[0]);
});

test('every step of the scale is one a run can reach', () => {
  // A pentatonic scale, so no two notes in a run can sound wrong together
  // however the player gets there.
  for (let step = 1; step <= SCALE.length; step++) {
    expect(SCALE).toContain(noteFor(step));
  }
});
