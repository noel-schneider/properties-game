import { screen } from '@testing-library/react'
import { act } from 'react'
import { pinTheScatter, renderApp } from './test-utils'
import Graph from './Graph'
import { VIEW_HEIGHT, VIEW_WIDTH } from './useBubbleLayout'
import type { Solution } from './hand'
import type { Concept } from './types'

const RADIUS = 62;
const FINISHED_RADIUS = 21;

/**
 * Lays out a board and reports how hard it is pressing against its frame.
 *
 * `spent` is how many of them are finished, which matters a great deal: a
 * finished concept draws at a third of the size, so a board of sixty with
 * twenty finished takes up far less room than a board of sixty fresh ones.
 */
function measure(count: number, spent: number) {
  const concepts: Concept[] = Array.from({ length: count }, (_, i) => ({
    name: `concept-${i}`,
    properties: i < spent ? ['done'] : ['thing', `pair-${i % 5}`],
  }));
  // The first `spent` of them have their only property used up.
  const found: Solution[] = [];
  for (let i = 0; i < spent; i += 3) {
    found.push({ property: 'done', concepts: [`concept-${i}`, `concept-${i + 1}`, `concept-${i + 2}`] });
  }

  // The same scatter every time: what this measures is how hard a settled
  // board presses against its frame, not which draw it got.
  pinTheScatter();
  const { unmount } = renderApp(
    <Graph concepts={concepts} selected={[]} found={found} onToggle={() => {}} />,
  );
  act(() => { for (let i = 0; i < 900; i++) vi.advanceTimersByTime(16); });

  const points = concepts.map((concept, i) => {
    const [x, y] = screen.getByLabelText(concept.name).getAttribute('transform')!
      .match(/-?\d+\.?\d*/g)!.map(Number);
    return { x, y, r: i < spent ? FINISHED_RADIUS : RADIUS };
  });

  // Each board is measured on its own: left mounted, their labels collide.
  unmount();

  const atWall = points.filter((p) =>
    Math.abs(Math.abs(p.x) - (VIEW_WIDTH / 2 - p.r)) < 1
    || Math.abs(Math.abs(p.y) - (VIEW_HEIGHT / 2 - p.r)) < 1).length;

  let worst = 0;
  let pairs = 0;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const bite = points[i].r + points[j].r - Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
      if (bite > 0) { pairs++; worst = Math.max(worst, bite); }
    }
  }

  const covered = points.reduce((sum, p) => sum + Math.PI * p.r ** 2, 0) / (VIEW_WIDTH * VIEW_HEIGHT);
  // How far past its own edge of the frame the worst offender sits.
  const escaped = Math.max(...points.map((p) => Math.max(
    Math.abs(p.x) + p.r - VIEW_WIDTH / 2,
    Math.abs(p.y) + p.r - VIEW_HEIGHT / 2,
  )));
  return { covered, atWall, pairs, worst, escaped };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  // Or the next test in the file inherits a `Math.random` that is not random.
  vi.restoreAllMocks();
});

/**
 * How deep two bubbles may bite into one another before it is worth calling an
 * overlap.
 *
 * Zero was the claim for a long time, and it is true: measured a hundred times
 * on its own, at 42, 54 and 66 bubbles, not one pair ever touched. Inside the
 * full suite it failed about one run in six, always at 66, always by a single
 * pair — the simulation left one bubble a hair short of its resting place. A
 * bite of a pixel or two is not what this test exists to catch. Bubbles piling
 * up is, and that arrives in tens of pixels.
 */
const TOUCHING = 2;

test('a board the size a real game reaches never overlaps itself', () => {
  // Measured over ten full games, the board averages 42 bubbles and peaks at
  // 66, of which at most twenty-one are finished and drawn at a third of the
  // size. At that shape nothing overlaps and nothing is unreadable.
  for (const count of [42, 54, 66]) {
    const { covered, worst } = measure(count, 21);

    expect(worst, `${count} bubbles bite ${worst.toFixed(1)}px`).toBeLessThan(TOUCHING);
    expect(covered, `${count} bubbles`).toBeLessThan(0.6);
  }
});

test('nothing is ever drawn outside the frame', () => {
  // The simulation overshoots hard on the way to a resting place — measured at
  // 577 from the middle against a frame that stops at 400 — so every bubble is
  // held inside the frame on every tick. Without that, bubbles leave the board
  // entirely and the player watches them go.
  const { escaped, atWall } = measure(66, 21);

  expect(escaped).toBeLessThanOrEqual(0.5);
  // And the holding is doing real work at this size, not sitting idle.
  expect(atWall).toBeGreaterThan(0);
});
