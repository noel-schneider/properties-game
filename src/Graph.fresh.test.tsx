import { renderApp } from './test-utils'
import Graph from './Graph'
import type { Concept } from './types'

const concepts: Concept[] = [
  { name: 'ant', properties: ['insect', 'small'] },
  { name: 'bee', properties: ['insect', 'small'] },
  { name: 'moth', properties: ['insect', 'night'] },
  { name: 'coin', properties: ['small', 'metal'] },
];

function bubble(name: string) {
  return document.querySelector(`.bubble[aria-label="${name}"]`)!;
}

function board(arriving: string[]) {
  return renderApp(
      <Graph concepts={concepts} selected={[]} found={[]} arriving={arriving} onToggle={() => {}} />);
}

test('a concept that has just arrived is marked', () => {
  // Fresh ones used to slide in among twenty others with nothing to say so.
  board(['moth', 'coin']);

  expect(bubble('moth').classList.contains('bubble--fresh')).toBe(true);
  expect(bubble('coin').classList.contains('bubble--fresh')).toBe(true);
  expect(bubble('ant').classList.contains('bubble--fresh')).toBe(false);
});

test('it carries a ring of its own, so the mark survives a still board', () => {
  // Reduced motion turns the animation off; the ring is what is left.
  board(['moth']);

  expect(bubble('moth').querySelector('.arrival')).not.toBeNull();
  expect(bubble('ant').querySelector('.arrival')).toBeNull();
});

test('nothing is marked when nothing has arrived', () => {
  board([]);

  expect(document.querySelectorAll('.bubble--fresh')).toHaveLength(0);
});
