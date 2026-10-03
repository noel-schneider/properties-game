import { renderApp } from './test-utils'
import Graph from './Graph'
import type { Solution } from './hand'
import type { Concept } from './types'

// ant keeps two live properties; the group below spends `insect` for all three.
const concepts: Concept[] = [
  { name: 'ant', properties: ['insect', 'small', 'underground'] },
  { name: 'bee', properties: ['insect', 'small'] },
  { name: 'moth', properties: ['insect', 'small'] },
  { name: 'mole', properties: ['underground', 'small'] },
  { name: 'worm', properties: ['underground', 'small'] },
];
const found: Solution[] = [{ property: 'insect', concepts: ['ant', 'bee', 'moth'] }];

function board(groups: Solution[] = found, pool: Concept[] = concepts) {
  return renderApp(<Graph concepts={pool} selected={[]} found={groups} onToggle={() => {}} />);
}

function bubble(name: string) {
  return document.querySelector(`.bubble[aria-label="${name}"]`)!;
}

/** How much of the rim is drawn, as a fraction of the way round. */
function arc(name: string): number | null {
  const gauge = bubble(name).querySelector('.gauge');
  if (!gauge) return null;

  const [drawn, round] = gauge.getAttribute('stroke-dasharray')!.split(' ').map(Number);
  return drawn / round;
}

test('a concept nobody has used yet shows nothing', () => {
  // Empty at the start is the point: a full ring on every bubble of a fresh
  // board says nothing, and a mark that is always there stops being read.
  board([]);

  expect(arc('ant')).toBeNull();
});

test('one property found of three fills a third of the rim', () => {
  board();

  // ant has spent `insect`; `small` and `underground` are both still
  // reachable, so it is one of three.
  expect(arc('ant')).toBeCloseTo(1 / 3, 2);
});

test('a property nobody can pair on is left out of the reckoning', () => {
  // Otherwise a concept holding a stranded property would sit short of full
  // for the rest of the game, promising something that can never be had.
  const lonely: Concept[] = [
    // `rare` is ant's alone: nothing else in this pool has it, ever.
    { name: 'ant', properties: ['insect', 'small', 'rare'] },
    { name: 'bee', properties: ['insect', 'small'] },
    { name: 'moth', properties: ['insect', 'small'] },
  ];
  board([{ property: 'insect', concepts: ['ant', 'bee', 'moth'] }], lonely);

  // One of the two it can ever be used for — not one of the three it holds.
  expect(arc('ant')).toBeCloseTo(1 / 2, 2);
});

test('a concept with nothing left to find shows no gauge at all', () => {
  // It has shrunk to a dot by then: a gauge on it would be a full ring saying
  // what the size already says.
  board([
    { property: 'insect', concepts: ['ant', 'bee', 'moth'] },
    { property: 'small', concepts: ['bee', 'moth', 'mole'] },
  ]);

  expect(arc('bee')).toBeNull();
});
