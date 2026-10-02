import { fireEvent } from '@testing-library/react'
import { renderApp } from './test-utils'
import Graph from './Graph'
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

test('reaching a concept with the keyboard reveals its kin too', () => {
  // The reveal is the only way to see what a concept shares, so it cannot be
  // for mouse users alone.
  board();
  fireEvent.focus(bubble('ant'));

  expect(lit('bee')).toBe(true);
});
