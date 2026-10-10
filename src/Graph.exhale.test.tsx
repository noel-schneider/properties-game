import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { screen } from '@testing-library/react'
import { pinTheScatter, renderApp } from './test-utils'
import Graph, { EXHALES } from './Graph'
import type { Solution } from './hand'
import type { Concept } from './types'

const css = readFileSync(join(__dirname, 'Graph.css'), 'utf8');

const concepts: Concept[] = [
  { name: 'ant', properties: ['insect', 'small'] },
  { name: 'bee', properties: ['insect', 'small'] },
  { name: 'moth', properties: ['insect'] },
  { name: 'coin', properties: ['metal', 'small'] },
  { name: 'key', properties: ['metal', 'small'] },
  { name: 'pin', properties: ['metal', 'small'] },
];

// moth had only `insect`, and it has been used.
const found: Solution[] = [{ property: 'insect', concepts: ['ant', 'bee', 'moth'] }];

function board() {
  pinTheScatter();
  return renderApp(<Graph concepts={concepts} selected={[]} found={found} onToggle={() => {}} />);
}

afterEach(() => vi.restoreAllMocks());

test('a concept lets go of a little air now and then', () => {
  board();

  expect(screen.getByLabelText('ant').parentElement!.querySelectorAll('.exhale')).toHaveLength(EXHALES);
});

test('and a concept with nothing left to give does not', () => {
  // It is a dot a third of the size, sitting out the rest of the game. Air
  // coming off it says something is still happening there.
  board();

  expect(screen.getByLabelText('moth').parentElement!.querySelectorAll('.exhale')).toHaveLength(0);
});

test('no two concepts breathe out together', () => {
  // A board exhaling in unison is one animal, not twenty things in water.
  board();

  const delays = [...document.querySelectorAll('.bubble-float')].map(
    (layer) => (layer as HTMLElement).style.getPropertyValue('--exhale-delay'),
  );

  expect(new Set(delays).size).toBeGreaterThan(concepts.length / 2);
});

test('the air leaves the bubble rather than the group it is drawn in', () => {
  // Outside the bubble, or the shape Playwright and every pointer measure
  // grows and shrinks three times a minute and the concept becomes a target
  // that will not hold still. The board has been caught by that once.
  board();

  expect(screen.getByLabelText('ant').querySelectorAll('.exhale')).toHaveLength(0);
});

test('and none of it happens for a player who asked for less motion', () => {
  expect(css).toMatch(/prefers-reduced-motion[\s\S]*\.exhale\s*\{[^}]*animation:\s*none/);
});
