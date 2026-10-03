import { renderApp } from './test-utils'
import Graph from './Graph'
import { COUNT_LOOKS, DEFAULT_COUNT_LOOK } from './countLooks'
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

function board(counts: string) {
  return renderApp(
    <Graph concepts={concepts} selected={[]} found={found} onToggle={() => {}} counts={counts} />,
  );
}

function bubble(name: string) {
  return document.querySelector(`.bubble[aria-label="${name}"]`)!;
}

test('the standing board shows none of this', () => {
  board(DEFAULT_COUNT_LOOK);

  expect(document.querySelectorAll('.pip')).toHaveLength(0);
  expect(document.querySelectorAll('.tally')).toHaveLength(0);
  expect(document.querySelectorAll('.gauge')).toHaveLength(0);
});

test('every look on the bench exists and is distinct', () => {
  expect(COUNT_LOOKS.map((l) => l.id)).toContain(DEFAULT_COUNT_LOOK);
  expect(new Set(COUNT_LOOKS.map((l) => l.id)).size).toBe(COUNT_LOOKS.length);
});

test('a pip for each property still reachable, and none for the rest', () => {
  board('pips');

  // ant has spent `insect`; `small` and `underground` both still have two
  // companions, so two are left to find.
  expect(bubble('ant').querySelectorAll('.pip')).toHaveLength(2);
});

test('the count is of what can still be had, not of what is merely unfound', () => {
  // bee has spent `insect` and holds `small`, which still has companions — one
  // left. Were it counting unfound properties it would say one as well, so the
  // case that separates them is a property with nobody left to pair with.
  const lonely: Concept[] = [
    { name: 'ant', properties: ['insect', 'rare'] },
    { name: 'bee', properties: ['insect'] },
    { name: 'moth', properties: ['insect'] },
  ];
  renderApp(
    <Graph concepts={lonely} selected={[]} found={[]} onToggle={() => {}} counts="number" />,
  );

  // `rare` is ant's alone, so ant can only ever be used for `insect`.
  expect(bubble('ant').querySelector('.tally')?.textContent).toBe('1');
});

test('a concept with nothing left to find shows no count at all', () => {
  const done: Solution[] = [
    { property: 'insect', concepts: ['ant', 'bee', 'moth'] },
    { property: 'small', concepts: ['bee', 'moth', 'mole'] },
  ];
  renderApp(
    <Graph concepts={concepts} selected={[]} found={done} onToggle={() => {}} counts="pips" />,
  );

  expect(bubble('bee').querySelectorAll('.pip')).toHaveLength(0);
});

describe('the gauge fills as a concept is worked out', () => {
  function arc(name: string) {
    const gauge = bubble(name).querySelector('.gauge');
    if (!gauge) return null;
    const [drawn, round] = gauge.getAttribute('stroke-dasharray')!.split(' ').map(Number);
    return drawn / round;
  }

  test('a concept nobody has used yet shows nothing', () => {
    // Empty at the start is the point: eighteen full rings on a fresh board
    // say nothing, and a mark that is always there stops being read.
    renderApp(
      <Graph concepts={concepts} selected={[]} found={[]} onToggle={() => {}} counts="gauge" />,
    );

    expect(arc('ant')).toBeNull();
  });

  test('one property found of three fills a third of the rim', () => {
    board('gauge');

    // ant has spent `insect`, and `small` and `underground` are both still
    // reachable: one of three.
    expect(arc('ant')).toBeCloseTo(1 / 3, 2);
  });

  test('a property nobody can pair on is left out of the reckoning', () => {
    // Otherwise a concept holding a stranded property could never fill its
    // gauge, and would sit short of full for the rest of the game.
    const lonely: Concept[] = [
      // `rare` is ant's alone: nothing else in this pool has it, ever.
      { name: 'ant', properties: ['insect', 'small', 'rare'] },
      { name: 'bee', properties: ['insect', 'small'] },
      { name: 'moth', properties: ['insect', 'small'] },
    ];
    const spent: Solution[] = [{ property: 'insect', concepts: ['ant', 'bee', 'moth'] }];
    renderApp(
      <Graph concepts={lonely} selected={[]} found={spent} onToggle={() => {}} counts="gauge" />,
    );

    // One of the two it can ever be used for — not one of the three it holds.
    expect(arc('ant')).toBeCloseTo(1 / 2, 2);
  });
})
