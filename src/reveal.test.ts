import { ARC_GAP, arcDash, HUES, huesFor, ringRadius } from './reveal'

test('each category of the concept being pointed at gets its own colour', () => {
  const hues = huesFor(['insect', 'small', 'metal']);

  expect(new Set(hues.values()).size).toBe(3);
});

test('the palette holds a colour for the most properties one concept can carry', () => {
  // The data allows five, and `concepts.data.test.ts` holds it there. A sixth
  // category would have to borrow a colour, which is the one thing a colour
  // code may not do.
  const hues = huesFor(['one', 'two', 'three', 'four', 'five']);

  expect(new Set(hues.values()).size).toBe(5);
  expect(HUES.length).toBeGreaterThanOrEqual(5);
});

test('the same categories come back the same colours', () => {
  // The board redraws on every frame while it settles. A colour that moved
  // between frames would make the whole reveal flicker.
  const first = huesFor(['insect', 'small']);
  const again = huesFor(['insect', 'small']);

  expect([...again]).toEqual([...first]);
});

test('a category keeps its colour whoever is pointed at', () => {
  // Two concepts share `insect`; pointing at either must say the same colour
  // about it, or the code teaches nothing.
  expect(huesFor(['small', 'insect']).get('insect')).toBe(
    huesFor(['insect', 'metal']).get('insect'),
  );
});

test('the slices of a ring add up to the ring', () => {
  const radius = 62;
  const round = 2 * Math.PI * radius;
  const { dash } = arcDash(radius, 3, 0);

  expect((dash + ARC_GAP) * 3).toBeCloseTo(round);
});

test('each slice starts where the one before it ended', () => {
  const radius = 62;
  const slice = (2 * Math.PI * radius) / 4;

  expect(arcDash(radius, 4, 0).offset).toBeCloseTo(0);
  expect(arcDash(radius, 4, 1).offset).toBeCloseTo(-slice);
  expect(arcDash(radius, 4, 3).offset).toBeCloseTo(-slice * 3);
});

test('a lone category takes the whole ring', () => {
  // No second slice to be told apart from, so no break worth cutting into it.
  const radius = 62;
  const { dash } = arcDash(radius, 1, 0);

  expect(dash).toBeCloseTo(2 * Math.PI * radius);
});

test('every ring sits outside the gauge, and outside the ring before it', () => {
  // The gauge is drawn at the bubble's radius plus seven. A coloured ring
  // crossing it would read as part of it.
  const radius = 62;
  const rings = [0, 1, 2, 3, 4].map((i) => ringRadius(radius, i));

  expect(rings[0]).toBeGreaterThan(radius + 7);
  expect([...rings].sort((a, b) => a - b)).toEqual(rings);
  expect(new Set(rings).size).toBe(5);
});

test('more categories than there are colours still leaves nobody out', () => {
  // A whole board lit at once reaches past the palette. Going round again is
  // the answer; hanging while looking for a free colour is not.
  const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
  const hues = huesFor(many);

  expect([...hues.keys()]).toEqual(many);
  expect([...hues.values()].every((hue) => HUES.includes(hue as (typeof HUES)[number]))).toBe(true);
});

test('the first categories handed a colour never share one', () => {
  // The ones the pointed concept is in come first, and those are the colours
  // the player is asked to tell apart.
  const hues = huesFor(['insect', 'small', 'metal', 'cold', 'red', 'sweet', 'loud']);
  const first = ['insect', 'small', 'metal', 'cold', 'red'].map((p) => hues.get(p));

  expect(new Set(first).size).toBe(5);
});
