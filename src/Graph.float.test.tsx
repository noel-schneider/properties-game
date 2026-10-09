import { act, fireEvent } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pinTheScatter, renderApp } from './test-utils'
import Graph, { IDLE_AFTER } from './Graph'
import type { Concept } from './types'

const css = readFileSync(join(__dirname, 'Graph.css'), 'utf8');

const concepts: Concept[] = Array.from({ length: 8 }, (_, i) => ({
  name: `concept-${i}`,
  properties: ['thing', `pair-${i % 3}`],
}));

function board() {
  pinTheScatter();
  return renderApp(<Graph concepts={concepts} selected={[]} found={[]} onToggle={() => {}} />);
}

function floats(): HTMLElement[] {
  return [...document.querySelectorAll('.bubble-float')] as unknown as HTMLElement[];
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test('every concept hangs in a layer of its own that can drift', () => {
  // On a wrapper rather than on the bubble: the bubble carries the transform
  // the simulation writes on every frame, and a second one here would fight
  // it.
  board();

  expect(floats()).toHaveLength(concepts.length);
});

test('and no two of them drift together', () => {
  // Handed one cycle they rise and fall as a single object, which is the one
  // thing a board of things floating separately must not do.
  board();

  const delays = floats().map((layer) => layer.style.getPropertyValue('--float-delay'));
  expect(new Set(delays).size).toBeGreaterThan(concepts.length / 2);
});

test('the board says nothing is happening once the hand has been still a while', () => {
  board();

  expect(document.querySelector('.graph')!.getAttribute('data-idle')).toBe('false');
  act(() => { vi.advanceTimersByTime(IDLE_AFTER + 100); });
  expect(document.querySelector('.graph')!.getAttribute('data-idle')).toBe('true');
});

test('and takes it back the moment the hand moves', () => {
  board();
  act(() => { vi.advanceTimersByTime(IDLE_AFTER + 100); });

  fireEvent.pointerMove(document.querySelector('.graph')!, { clientX: 10, clientY: 10 });
  expect(document.querySelector('.graph')!.getAttribute('data-idle')).toBe('false');
});

test('an idle board moves more than a busy one, not less', () => {
  // The whole point of noticing: left alone, the water takes over.
  expect(css).toMatch(/\.graph\[data-idle="true"\][\s\S]{0,400}--float-amp:\s*([\d.]+)/);
  const idle = Number(css.match(/\.graph\[data-idle="true"\][\s\S]{0,400}--float-amp:\s*([\d.]+)/)![1]);
  const busy = Number(css.match(/\.bubble-float\s*\{[^}]*--float-amp:\s*([\d.]+)/)![1]);

  expect(idle).toBeGreaterThan(busy);
});

test('a player who asked for less motion gets a board that holds still', () => {
  expect(css).toMatch(/prefers-reduced-motion[\s\S]*\.bubble-float\s*\{[^}]*animation:\s*none/);
});
