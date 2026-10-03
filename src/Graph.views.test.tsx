import { fireEvent } from '@testing-library/react'
import { act } from 'react'
import { renderApp } from './test-utils'
import Graph, { LONG_PRESS } from './Graph'
import type { Solution } from './hand'
import type { Concept } from './types'

const concepts: Concept[] = [
  { name: 'ant', properties: ['insect', 'small'] },
  { name: 'bee', properties: ['insect', 'small'] },
  { name: 'moth', properties: ['insect', 'night'] },
  // Shares `small` with ant and bee, but that category has not been found.
  { name: 'coin', properties: ['small', 'metal'] },
];

const found: Solution[] = [{ property: 'insect', concepts: ['ant', 'bee', 'moth'] }];

function board(groups: Solution[] = found) {
  return renderApp(
    <Graph concepts={concepts} selected={[]} found={groups} onToggle={() => {}} />,
  );
}

function bubble(name: string) {
  return document.querySelector(`.bubble[aria-label="${name}"]`)!;
}

function lit(name: string) {
  return bubble(name).classList.contains('bubble--kin');
}

test('hovering lights the concepts that share a found category', () => {
  board();
  fireEvent.pointerEnter(bubble('ant'));

  expect(['ant', 'bee', 'moth'].every(lit)).toBe(true);
});

test('hovering never lights a concept over a category still to be found', () => {
  // ant and coin share `small`, which nobody has found. Lighting coin would
  // hand the player a category they are still meant to work out.
  board();
  fireEvent.pointerEnter(bubble('ant'));

  expect(lit('coin')).toBe(false);
});

test('the rest of the board steps back, so the kin stand out', () => {
  board();
  fireEvent.pointerEnter(bubble('ant'));

  expect(bubble('coin').classList.contains('bubble--aside')).toBe(true);
});

test('a concept with nothing found yet leaves the board alone', () => {
  // Otherwise every bubble on the board dims to show a kinship of none.
  board();
  fireEvent.pointerEnter(bubble('coin'));

  expect(document.querySelectorAll('.bubble--aside')).toHaveLength(0);
  expect(document.querySelectorAll('.bubble--kin')).toHaveLength(0);
});

test('the board comes back when the pointer leaves', () => {
  board();
  fireEvent.pointerEnter(bubble('ant'));
  fireEvent.pointerLeave(bubble('ant'));

  expect(document.querySelectorAll('.bubble--aside')).toHaveLength(0);
});

// The keyboard reveal is covered end to end instead: jsdom reports
// :focus-visible as false for every element, so it cannot tell a focus the
// browser would draw a ring around from one left behind by a mouse click —
// which is the whole distinction.

describe('reaching the reveal without a pointer that hovers', () => {
  // A finger never hovers: on a touchscreen a tap selects and nothing is ever
  // revealed, which left this the one thing on the board a phone could not do.
  const press = (name: string, at = { clientX: 400, clientY: 300 }) =>
    fireEvent.pointerDown(bubble(name), { button: 0, ...at });

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('holding a concept still reveals its kin', () => {
    board();
    press('ant');
    act(() => { vi.advanceTimersByTime(LONG_PRESS); });

    expect(lit('bee')).toBe(true);
  });

  test('a quick tap reveals nothing, because a tap is how you select', () => {
    board();
    press('ant');
    act(() => { vi.advanceTimersByTime(LONG_PRESS / 4); });
    fireEvent.pointerUp(bubble('ant'), { clientX: 400, clientY: 300 });

    expect(lit('bee')).toBe(false);
  });

  test('dragging a concept reveals its kin too', () => {
    // Free, and it answers the same question while the concept is in the air:
    // which groups is this one already part of.
    board();
    press('ant');
    fireEvent.pointerMove(bubble('ant'), { clientX: 460, clientY: 340 });

    expect(lit('bee')).toBe(true);
  });

  test('letting go with a finger puts the board back', () => {
    board();
    press('ant');
    act(() => { vi.advanceTimersByTime(LONG_PRESS); });
    fireEvent.pointerUp(bubble('ant'), { pointerType: 'touch', clientX: 400, clientY: 300 });

    expect(lit('bee')).toBe(false);
  });
})
