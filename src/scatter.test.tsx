import { screen } from '@testing-library/react'
import { pinTheScatter, renderApp } from './test-utils'
import Graph from './Graph'
import type { Concept } from './types'

const concepts: Concept[] = Array.from({ length: 6 }, (_, i) => ({
  name: `concept-${i}`,
  properties: ['thing'],
}));

function placesOnScreen(): string[] {
  return concepts.map((c) => screen.getByLabelText(c.name).getAttribute('transform')!);
}

/** Lays a board out from scratch and reports where everything ended up. */
function layOut(): string[] {
  pinTheScatter();
  const { unmount } = renderApp(
    <Graph concepts={concepts} selected={[]} found={[]} onToggle={() => {}} />,
  );
  const places = placesOnScreen();
  unmount();
  return places;
}

afterEach(() => vi.restoreAllMocks());

test('two boards laid out in one test start from the same scatter', () => {
  // Every bubble is dropped at a random point and the forces take it from
  // there, so a test that measures one board against another is measuring two
  // different draws unless this is pinned. That is a test that fails on a bad
  // afternoon and tells nobody why.
  expect(layOut()).toEqual(layOut());
});

test('and the scatter is a scatter, not one spot', () => {
  // Pinned, not flattened: bubbles started on a single point fly clean off the
  // board before the pull to the middle wins them back.
  pinTheScatter();
  const draws = new Set(Array.from({ length: 12 }, () => Math.random()));

  expect(draws.size).toBe(12);
});
