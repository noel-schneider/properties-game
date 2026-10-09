import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pinTheScatter, renderApp } from './test-utils'
import Graph from './Graph'
import type { Solution } from './hand'
import type { Concept } from './types'

const css = readFileSync(join(__dirname, 'Graph.css'), 'utf8');

const concepts: Concept[] = [
  { name: 'ant', properties: ['insect', 'small'] },
  { name: 'bee', properties: ['insect', 'small'] },
  { name: 'moth', properties: ['insect', 'small'] },
  { name: 'coin', properties: ['metal', 'small'] },
  { name: 'key', properties: ['metal', 'small'] },
  { name: 'pin', properties: ['metal', 'small'] },
];

const insects: Solution = { property: 'insect', concepts: ['ant', 'bee', 'moth'] };
const metals: Solution = { property: 'metal', concepts: ['coin', 'key', 'pin'] };

function board(found: Solution[]) {
  pinTheScatter();
  return renderApp(<Graph concepts={concepts} selected={[]} found={found} onToggle={() => {}} />);
}

afterEach(() => vi.restoreAllMocks());

test('nothing has disturbed the water before anything is found', () => {
  board([]);

  expect(document.querySelectorAll('.shock')).toHaveLength(0);
});

test('a find sends one ring out through the water', () => {
  board([insects]);

  expect(document.querySelectorAll('.shock')).toHaveLength(1);
});

test('and only the last one does: the board is not a pond in a storm', () => {
  board([insects, metals]);

  expect(document.querySelectorAll('.shock')).toHaveLength(1);
});

test('the ring is replaced rather than left running when the next find lands', () => {
  // Keyed on which find it belongs to, or React keeps the element it already
  // has and the animation never plays again.
  const { rerender } = board([insects]);
  const first = document.querySelector('.shock')!.getAttribute('data-find');

  rerender(<Graph concepts={concepts} selected={[]} found={[insects, metals]} onToggle={() => {}} />);

  expect(document.querySelector('.shock')!.getAttribute('data-find')).not.toBe(first);
});

test('the three concepts let go of some air', () => {
  // One stream each, so the answer comes from the concepts rather than from
  // somewhere between them.
  board([insects]);

  expect(document.querySelectorAll('.spout')).toHaveLength(insects.concepts.length);
});

test('the outline of the new group draws itself rather than arriving drawn', () => {
  expect(css).toMatch(/@keyframes tighten[\s\S]{0,300}stroke-dasharray/);
});

test('none of it happens for a player who asked for less motion', () => {
  expect(css).toMatch(/prefers-reduced-motion[\s\S]*\.shock\s*\{[^}]*(animation:\s*none|display:\s*none)/);
});
