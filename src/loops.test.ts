import { aroundTheMiddle, fannedSides, pathOf, SIDE_SHIFT } from './loops'
import type { Corner, Side } from './loops'
import type { Point } from './useBubbleLayout'

const corner = (name: string, x: number, y: number): Corner => ({ name, at: { x, y } });

/** A triangle, and a second one hinged on two of its corners. */
const left = [corner('a', 0, -100), corner('b', -87, 50), corner('c', 87, 50)];
const right = [corner('a', 0, -100), corner('c', 87, 50), corner('d', 160, -60)];

/**
 * The one drawn side running between these two corners, read from `a` towards
 * `b` whichever way round the group happens to draw it.
 */
function sideBetween(sides: Side[], a: Corner, b: Corner): Side {
  const near = (p: Point, q: Corner) => Math.hypot(p.x - q.at.x, p.y - q.at.y) < SIDE_SHIFT * 1.5;
  const side = sides.find(
    (one) => (near(one.from, a) && near(one.to, b)) || (near(one.from, b) && near(one.to, a)),
  )!;

  return near(side.from, a) ? side : { from: side.to, to: side.from };
}

test('the corners of a loop come in the order they sit around the middle', () => {
  // Fed in any other order the shape crosses itself, which is what happens
  // every time the simulation moves one member past another.
  const angles = aroundTheMiddle([left[2], left[0], left[1]]).map((c) => Math.atan2(c.at.y, c.at.x));

  expect([...angles].sort((a, b) => a - b)).toEqual(angles);
});

test('a group nobody overlaps is drawn exactly where its members are', () => {
  const [sides] = fannedSides([left]);

  expect(sides).toHaveLength(3);
  expect(sides[0].from).toEqual(left[0].at);
  expect(sides[0].to).toEqual(left[1].at);
});

test('a side two groups share is drawn twice, side by side', () => {
  // Both categories run a line between the same two bubbles. Drawn on the
  // same track the second paints over the first, and the board says one
  // category where two were found.
  const [first, second] = fannedSides([left, right]);

  const mine = sideBetween(first, left[0], left[2]);
  const theirs = sideBetween(second, left[0], left[2]);

  const apart = Math.hypot(mine.from.x - theirs.from.x, mine.from.y - theirs.from.y);
  expect(apart).toBeCloseTo(SIDE_SHIFT);
});

test('and the two sit either side of where the one would have been', () => {
  const [first, second] = fannedSides([left, right]);

  const mine = sideBetween(first, left[0], left[2]);
  const theirs = sideBetween(second, left[0], left[2]);

  expect((mine.from.x + theirs.from.x) / 2).toBeCloseTo(left[0].at.x);
  expect((mine.from.y + theirs.from.y) / 2).toBeCloseTo(left[0].at.y);
});

test('the sides a group keeps to itself do not move because another one moved', () => {
  const [first] = fannedSides([left, right]);

  expect(sideBetween(first, left[1], left[2]).from).toEqual(left[1].at);
});

test('three groups on one side leave the middle one where it was', () => {
  const third = [corner('a', 0, -100), corner('c', 87, 50), corner('e', -200, 0)];
  const [, second] = fannedSides([left, right, third]);

  expect(sideBetween(second, left[0], left[2]).from).toEqual(left[0].at);
});

test('sides that join up end to end are one closed shape', () => {
  // One closed curve rather than three spokes meeting at a bare point, which
  // read as a wiring diagram.
  const path = pathOf(fannedSides([left])[0]);

  expect(path.endsWith('Z')).toBe(true);
  expect(path.match(/M/g)).toHaveLength(1);
  expect(path.match(/L/g)).toHaveLength(2);
});

test('sides pushed off one another are drawn one line each', () => {
  const path = pathOf(fannedSides([left, right])[0]);

  expect(path.endsWith('Z')).toBe(false);
  expect(path.match(/M/g)).toHaveLength(3);
});

test('two concepts make one side, not the same side twice', () => {
  // A group can be down to two members on the board, and a line drawn there
  // and back is a line drawn twice.
  const [sides] = fannedSides([[left[0], left[1]]]);

  expect(sides).toHaveLength(1);
});
