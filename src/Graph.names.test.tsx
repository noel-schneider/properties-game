import { fireEvent, screen } from '@testing-library/react'
import { renderApp } from './test-utils'
import Graph from './Graph'
import type { Solution } from './hand'
import type { Concept } from './types'

const concepts: Concept[] = [
  { name: 'ant', properties: ['insect', 'small', 'underground'] },
  { name: 'bee', properties: ['insect', 'small'] },
  { name: 'moth', properties: ['insect'] },
  { name: 'coin', properties: ['small', 'metal'] },
  { name: 'key', properties: ['small', 'metal'] },
  { name: 'mole', properties: ['underground', 'small'] },
  { name: 'bat', properties: ['underground'] },
  // In nothing anyone has found: `small` is still open.
  { name: 'pin', properties: ['small'] },
];

// ant belongs to three of these; the last one found is `metal`, which it is
// not part of.
const found: Solution[] = [
  { property: 'insect', concepts: ['ant', 'bee', 'moth'] },
  { property: 'underground', concepts: ['ant', 'mole', 'bat'] },
  { property: 'metal', concepts: ['coin', 'key', 'bee'] },
];

function board() {
  return renderApp(<Graph concepts={concepts} selected={[]} found={found} onToggle={() => {}} />);
}

function named() {
  return [...document.querySelectorAll('.found__label')].map((label) => label.textContent);
}

test('at rest, only the group just found says what it was', () => {
  // Twenty names drawn at once is an unreadable heap, which is why they are
  // not all drawn all the time.
  board();

  expect(named()).toEqual(['metal']);
});

test('pointing at a concept names every category it is in', () => {
  // The whole point of the reveal was undercut by showing which concepts
  // share something without ever saying what.
  board();
  fireEvent.pointerEnter(screen.getByLabelText('ant'));

  expect(named().sort()).toEqual(['insect', 'underground']);
});

test('the group just found steps aside while a concept is being read', () => {
  board();
  fireEvent.pointerEnter(screen.getByLabelText('ant'));

  expect(named()).not.toContain('metal');
});

test('a concept in nothing yet leaves the board as it was', () => {
  board();
  fireEvent.pointerEnter(screen.getByLabelText('pin'));

  expect(named()).toEqual(['metal']);
});
