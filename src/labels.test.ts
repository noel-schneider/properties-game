import { LABEL_CLEARANCE, spreadLabels } from './labels'

test('labels far apart are left exactly where they are', () => {
  const places = [{ x: 0, y: 0 }, { x: 300, y: 200 }];

  expect(spreadLabels(places, [60, 60])).toEqual(places);
});

test('two labels on top of each other are pushed apart', () => {
  // Two groups can share almost the same middle, and their names then land on
  // one another — which is what naming several at once walked into.
  const spread = spreadLabels([{ x: 10, y: 100 }, { x: 14, y: 104 }], [60, 60]);

  expect(Math.abs(spread[0].y - spread[1].y)).toBeGreaterThanOrEqual(LABEL_CLEARANCE);
});

test('they are pushed apart without wandering sideways', () => {
  const spread = spreadLabels([{ x: 10, y: 100 }, { x: 14, y: 104 }], [60, 60]);

  expect(spread.map((p) => p.x)).toEqual([10, 14]);
});

test('three in a heap all come apart', () => {
  const spread = spreadLabels([{ x: 0, y: 50 }, { x: 0, y: 52 }, { x: 0, y: 54 }], [60, 60, 60]);
  const ys = spread.map((p) => p.y).sort((a, b) => a - b);

  expect(ys[1] - ys[0]).toBeGreaterThanOrEqual(LABEL_CLEARANCE);
  expect(ys[2] - ys[1]).toBeGreaterThanOrEqual(LABEL_CLEARANCE);
});

test('the order given is the order returned, so a name keeps its group', () => {
  const places = [{ x: 0, y: 54 }, { x: 0, y: 50 }];
  const spread = spreadLabels(places, [60, 60]);

  expect(spread).toHaveLength(2);
  expect(spread[0].x).toBe(places[0].x);
});

test('a row of names side by side is left alone, not stacked into a ladder', () => {
  // The push used to be owed to every name before it, however far away, so six
  // names spread across the board came back as a column of six down one side of
  // it. Only names that actually overlap may move each other.
  const places = Array.from({ length: 6 }, (_, i) => ({ x: i * 200 - 500, y: 0 }));
  const widths = places.map(() => 60);

  expect(spreadLabels(places, widths).map((p) => p.y)).toEqual(places.map(() => 0));
});

test('names heaped at a place where the clearance does not divide cleanly all come apart', () => {
  // Taken off a real board. 21.075386869665454 + 24 - 21.075386869665454 is
  // 23.999999999999996, not 24 — so asking whether the gap has reached the
  // clearance says no straight after it was set. The walk then pushes a name to
  // where it already is: for ever without a bound, and against the bound with
  // the names left on top of one another.
  const y = 21.075386869665454;
  const places = Array.from({ length: 4 }, () => ({ x: 156.83, y }));

  const ys = spreadLabels(places, [46, 57.5, 69, 52]).map((p) => p.y).sort((a, b) => a - b);

  expect(new Set(ys).size).toBe(4);
  for (let i = 1; i < ys.length; i++) {
    expect(ys[i] - ys[i - 1]).toBeGreaterThan(LABEL_CLEARANCE - 1e-6);
  }
});
