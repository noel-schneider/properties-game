import { fireEvent } from '@testing-library/react'
import { renderApp } from './test-utils'
import Graph from './Graph'
import { DEFAULT_VIEW, VIEWS } from './boardViews'
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

function board(view: string) {
  return renderApp(
    <Graph concepts={concepts} selected={[]} found={found} onToggle={() => {}} view={view} />,
  );
}

function bubble(name: string) {
  return document.querySelector(`.bubble[aria-label="${name}"]`)!;
}

test('the standing board shows none of this', () => {
  board(DEFAULT_VIEW);

  expect(document.querySelectorAll('.hub')).toHaveLength(0);
  expect(document.querySelectorAll('.bubble__arc')).toHaveLength(0);
});

test('every view on the bench exists', () => {
  expect(VIEWS.map((view) => view.id)).toContain(DEFAULT_VIEW);
  expect(new Set(VIEWS.map((v) => v.id)).size).toBe(VIEWS.length);
});

test('a hub stands for each found category, and says which', () => {
  board('hub');

  const hubs = document.querySelectorAll('.hub');
  expect(hubs).toHaveLength(found.length);
  expect(document.querySelector('.hub__name')?.textContent).toBe('insect');
});

test('hovering lights the concepts that share a found category', () => {
  board('hover');
  fireEvent.pointerEnter(bubble('ant'));

  for (const name of ['ant', 'bee', 'moth']) {
    expect(bubble(name).classList.contains('bubble--kin')).toBe(true);
  }
});

test('hovering never lights a concept over a category still to be found', () => {
  // ant and coin share `small`, which nobody has found. Lighting coin would
  // hand the player a category they are still meant to work out.
  board('hover');
  fireEvent.pointerEnter(bubble('ant'));

  expect(bubble('coin').classList.contains('bubble--kin')).toBe(false);
});

test('a concept wears one arc per category it has been used for', () => {
  board('ring');

  // ant is in one found group; coin is in none.
  expect(bubble('ant').querySelectorAll('.bubble__arc')).toHaveLength(1);
  expect(bubble('coin').querySelectorAll('.bubble__arc')).toHaveLength(0);
});
