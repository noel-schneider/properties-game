import { fireEvent, screen } from '@testing-library/react'
import { renderApp } from './test-utils'
import Graph from './Graph'
import type { Solution } from './hand'
import type { Concept } from './types'

const concepts: Concept[] = [
  { name: 'ant', properties: ['insect', 'small', 'underground'] },
  { name: 'bee', properties: ['insect', 'small'] },
  { name: 'moth', properties: ['insect'] },
  { name: 'wasp', properties: ['insect'] },
  { name: 'fly', properties: ['insect'] },
  { name: 'gnat', properties: ['insect'] },
  { name: 'coin', properties: ['small', 'metal'] },
  { name: 'key', properties: ['small', 'metal'] },
  { name: 'mole', properties: ['underground', 'small'] },
  { name: 'bat', properties: ['underground'] },
  // In nothing anyone has found: `small` is still open.
  { name: 'pin', properties: ['small'] },
];

// ant belongs to two of these; the last one found is `metal`, which it is not
// part of.
const found: Solution[] = [
  { property: 'insect', concepts: ['ant', 'bee', 'moth'] },
  { property: 'underground', concepts: ['ant', 'mole', 'bat'] },
  { property: 'metal', concepts: ['coin', 'key', 'bee'] },
];

function board(groups: Solution[] = found) {
  return renderApp(<Graph concepts={concepts} selected={[]} found={groups} onToggle={() => {}} />);
}

function named() {
  return [...document.querySelectorAll('.found__label')].map((label) => label.textContent);
}

/** Whether a name is one of the pointed concept's own, or some other corner. */
function nearness(property: string) {
  return document.querySelector(`.found__label[data-property="${property}"]`)?.getAttribute('data-near');
}

test('nothing is named while nobody is pointing at anything', () => {
  // Every category found, named at once, was a heap: ten of them already piled
  // over the bubbles they belonged to, and a whole game reaches close to forty.
  // What a player has named is kept in the column down the left, where it costs
  // the board nothing.
  board();

  expect(named()).toEqual([]);
});

test('pointing at a concept names every category still on the board', () => {
  // A colour with no word against it is a colour nobody can read, and every
  // loop on the board is coloured while a concept is pointed at.
  board();
  fireEvent.pointerEnter(screen.getByLabelText('ant'));

  expect(named().sort()).toEqual(['insect', 'metal', 'underground']);
});

test('and says which of them the concept is in', () => {
  // metal is found, and ant is no part of it: named, but not in the weight
  // the two it belongs to are given.
  board();
  fireEvent.pointerEnter(screen.getByLabelText('ant'));

  expect(nearness('insect')).toBe('true');
  expect(nearness('underground')).toBe('true');
  expect(nearness('metal')).toBe('false');
});

test('the names go when the pointer does', () => {
  board();
  const ant = screen.getByLabelText('ant');
  fireEvent.pointerEnter(ant);
  fireEvent.pointerLeave(ant);

  expect(named()).toEqual([]);
});

test('a category found twice is named once', () => {
  // A property can be found again with different members, and two copies of one
  // word says nothing the first did not.
  board([
    { property: 'insect', concepts: ['ant', 'bee', 'moth'] },
    { property: 'insect', concepts: ['ant', 'wasp', 'fly'] },
  ]);
  fireEvent.pointerEnter(screen.getByLabelText('ant'));

  expect(named()).toEqual(['insect']);
});

test('a concept in nothing yet names nothing', () => {
  board();
  fireEvent.pointerEnter(screen.getByLabelText('pin'));

  expect(named()).toEqual([]);
});
