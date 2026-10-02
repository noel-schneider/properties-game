import { render, screen } from '@testing-library/react'
import { act } from 'react'
import Graph from './Graph'
import { BUBBLE_GAP, VIEW_HEIGHT, VIEW_WIDTH } from './useBubbleLayout'
import type { Concept } from './types'

const concepts: Concept[] = Array.from({ length: 15 }, (_, i) => ({
  name: `concept-${i}`,
  properties: ['thing'],
}));

function positions(): string[] {
  return screen.getAllByRole('checkbox').map((g) => g.getAttribute('transform') ?? '');
}

function runFrames(count: number) {
  act(() => {
    for (let i = 0; i < count; i++) vi.advanceTimersByTime(16);
  });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('the bubbles drift into place instead of appearing settled', () => {
  render(<Graph concepts={concepts} selected={[]} onToggle={() => {}} />);

  const atStart = positions();
  runFrames(10);

  expect(positions()).not.toEqual(atStart);
});

test('the drift comes to rest, so the bubbles can be aimed at', () => {
  render(<Graph concepts={concepts} selected={[]} onToggle={() => {}} />);

  runFrames(600);
  const settled = positions();
  runFrames(120);

  expect(positions()).toEqual(settled);
});

function centres(): Array<{ x: number; y: number }> {
  return positions().map((transform) => {
    const [x, y] = transform.replace(/[^\d.,-]/g, '').split(',').map(Number);
    return { x, y };
  });
}

test('every bubble ends up inside the frame, edges included', () => {
  render(<Graph concepts={concepts} selected={[]} onToggle={() => {}} />);
  runFrames(600);

  for (const { x, y } of centres()) {
    // Half the viewBox, less the radius of the bubble itself.
    expect(Math.abs(x) + 62).toBeLessThanOrEqual(VIEW_WIDTH / 2);
    expect(Math.abs(y) + 62).toBeLessThanOrEqual(VIEW_HEIGHT / 2);
  }
});

test('the bubbles keep clear of one another rather than touching', () => {
  render(<Graph concepts={concepts} selected={[]} onToggle={() => {}} />);
  runFrames(600);

  const placed = centres();
  for (let a = 0; a < placed.length; a++) {
    for (let b = a + 1; b < placed.length; b++) {
      const apart = Math.hypot(placed[a].x - placed[b].x, placed[a].y - placed[b].y);

      // Edge to edge, not centre to centre.
      expect(apart - 2 * 62).toBeGreaterThan(BUBBLE_GAP / 2);
    }
  }
});

test('a bubble keeps its identity while it moves, so clicks stay reliable', () => {
  render(<Graph concepts={concepts} selected={['concept-3']} onToggle={() => {}} />);
  runFrames(40);

  expect(screen.getByRole('checkbox', { name: 'concept-3' })).toHaveAttribute('aria-checked', 'true');
});

test('a selected bubble carries the selected class even under the cursor', () => {
  render(<Graph concepts={concepts} selected={['concept-2']} onToggle={() => {}} />);

  const bubble = screen.getByRole('checkbox', { name: 'concept-2' });
  expect(bubble).toHaveClass('bubble--selected');
  expect(bubble).toHaveAttribute('aria-checked', 'true');
});
