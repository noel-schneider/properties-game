import { render, screen } from '@testing-library/react'
import { act } from 'react'
import Graph from './Graph'
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

test('every bubble ends up inside the frame, edges included', () => {
  render(<Graph concepts={concepts} selected={[]} onToggle={() => {}} />);
  runFrames(600);

  for (const transform of positions()) {
    const [x, y] = transform.replace(/[^\d.,-]/g, '').split(',').map(Number);
    // Half the viewBox, less the radius of the bubble itself.
    expect(Math.abs(x) + 62).toBeLessThanOrEqual(410);
    expect(Math.abs(y) + 62).toBeLessThanOrEqual(330);
  }
});

test('a bubble keeps its identity while it moves, so clicks stay reliable', () => {
  render(<Graph concepts={concepts} selected={['concept-3']} onToggle={() => {}} />);
  runFrames(40);

  expect(screen.getByRole('checkbox', { name: 'concept-3' })).toHaveAttribute('aria-checked', 'true');
});
