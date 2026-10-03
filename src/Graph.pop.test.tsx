import { renderApp } from './test-utils'
import Graph from './Graph'
import type { Solution } from './hand'
import type { Concept } from './types'

const concepts: Concept[] = [
  { name: 'ant', properties: ['insect', 'small'] },
  { name: 'bee', properties: ['insect', 'small'] },
  { name: 'moth', properties: ['insect', 'night'] },
  { name: 'coin', properties: ['small', 'metal'] },
  { name: 'key', properties: ['small', 'metal'] },
  { name: 'bell', properties: ['metal', 'sound'] },
];

function bubble(name: string) {
  return document.querySelector(`.bubble[aria-label="${name}"]`)!;
}

function board(found: Solution[]) {
  return renderApp(<Graph concepts={concepts} selected={[]} found={found} onToggle={() => {}} />);
}

test('the three just found are marked, so the board can answer back', () => {
  board([{ property: 'insect', concepts: ['ant', 'bee', 'moth'] }]);

  for (const name of ['ant', 'bee', 'moth']) {
    expect(bubble(name).classList.contains('bubble--just-found')).toBe(true);
  }
  expect(bubble('coin').classList.contains('bubble--just-found')).toBe(false);
});

test('only the latest group is marked, or the whole board would keep flinching', () => {
  board([
    { property: 'insect', concepts: ['ant', 'bee', 'moth'] },
    { property: 'metal', concepts: ['coin', 'key', 'bell'] },
  ]);

  expect(bubble('ant').classList.contains('bubble--just-found')).toBe(false);
  expect(bubble('coin').classList.contains('bubble--just-found')).toBe(true);
});

test('a concept dropped into a group is marked too', () => {
  // The quiet move deserves the same answer back as the loud one.
  board([{ property: 'insect', concepts: ['ant', 'bee', 'moth', 'coin'] }]);

  expect(bubble('coin').classList.contains('bubble--just-found')).toBe(true);
});

test('nothing found, nothing flinching', () => {
  board([]);

  expect(document.querySelectorAll('.bubble--just-found')).toHaveLength(0);
});

test('the gauge is left out of the landing, so its dial does not swing', () => {
  // A gauge is a circle too, and it carries a rotation to start at the top.
  // An animation that scales every circle replaces that rotation outright.
  const rules = [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules].map((rule) => rule.cssText))
    .filter((text) => text.includes('just-found') && text.includes('animation'))
    .join(' ');

  expect(rules).toContain('first-of-type');
});
