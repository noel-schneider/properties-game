import { LABEL_CLEARANCE, spreadLabels } from './labels'

test('labels far apart are left exactly where they are', () => {
  const places = [{ x: 0, y: 0 }, { x: 300, y: 200 }];

  expect(spreadLabels(places)).toEqual(places);
});

test('two labels on top of each other are pushed apart', () => {
  // Two groups can share almost the same middle, and their names then land on
  // one another — which is what naming several at once walked into.
  const spread = spreadLabels([{ x: 10, y: 100 }, { x: 14, y: 104 }]);

  expect(Math.abs(spread[0].y - spread[1].y)).toBeGreaterThanOrEqual(LABEL_CLEARANCE);
});

test('they are pushed apart without wandering sideways', () => {
  const spread = spreadLabels([{ x: 10, y: 100 }, { x: 14, y: 104 }]);

  expect(spread.map((p) => p.x)).toEqual([10, 14]);
});

test('three in a heap all come apart', () => {
  const spread = spreadLabels([{ x: 0, y: 50 }, { x: 0, y: 52 }, { x: 0, y: 54 }]);
  const ys = spread.map((p) => p.y).sort((a, b) => a - b);

  expect(ys[1] - ys[0]).toBeGreaterThanOrEqual(LABEL_CLEARANCE);
  expect(ys[2] - ys[1]).toBeGreaterThanOrEqual(LABEL_CLEARANCE);
});

test('the order given is the order returned, so a name keeps its group', () => {
  const places = [{ x: 0, y: 54 }, { x: 0, y: 50 }];
  const spread = spreadLabels(places);

  expect(spread).toHaveLength(2);
  expect(spread[0].x).toBe(places[0].x);
});
