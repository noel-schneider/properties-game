import { DROP_REACH, groupUnderPointer } from './drop'

const left = { index: 0, places: [{ x: -200, y: 0 }, { x: -160, y: 40 }, { x: -240, y: 40 }] };
const right = { index: 1, places: [{ x: 300, y: 0 }, { x: 340, y: 40 }, { x: 260, y: 40 }] };

test('a pointer inside a group picks that group', () => {
  expect(groupUnderPointer({ x: -200, y: 20 }, [left, right])).toBe(0);
  expect(groupUnderPointer({ x: 300, y: 20 }, [left, right])).toBe(1);
});

test('a pointer far from everything picks nothing', () => {
  expect(groupUnderPointer({ x: 0, y: -400 }, [left, right])).toBeNull();
});

test('a pointer just outside a group still counts, so the drop is not pixel-perfect', () => {
  const centre = { x: -200, y: 80 / 3 };
  const justOutside = { x: centre.x, y: centre.y + 40 + DROP_REACH - 5 };

  expect(groupUnderPointer(justOutside, [left, right])).toBe(0);
});

test('between two groups, the nearer one wins', () => {
  // Two groups close enough that one point is within reach of both.
  const a = { index: 0, places: [{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 20, y: 40 }] };
  const b = { index: 1, places: [{ x: 120, y: 0 }, { x: 160, y: 0 }, { x: 140, y: 40 }] };

  expect(groupUnderPointer({ x: 50, y: 15 }, [a, b])).toBe(0);
  expect(groupUnderPointer({ x: 110, y: 15 }, [a, b])).toBe(1);
});

test('no groups means nothing to drop onto', () => {
  expect(groupUnderPointer({ x: 0, y: 0 }, [])).toBeNull();
});
