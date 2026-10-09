import { fireEvent, screen } from '@testing-library/react'
import { renderApp } from './test-utils'
import Graph from './Graph'
import type { Reveal } from './reveal'
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
];

// ant is in two of these. bee is in one of them, and in `metal`, which ant is
// no part of.
const found: Solution[] = [
  { property: 'insect', concepts: ['ant', 'bee', 'moth'] },
  { property: 'underground', concepts: ['ant', 'mole', 'bat'] },
  { property: 'metal', concepts: ['coin', 'key', 'bee'] },
];

function board(reveal: Reveal) {
  return renderApp(
    <Graph concepts={concepts} selected={[]} found={found} reveal={reveal} onToggle={() => {}} />,
  );
}

function point(at: string) {
  fireEvent.pointerEnter(screen.getByLabelText(at));
}

/** The colour a mark carries, or null where it carries none. */
function hueOf(mark: Element | null): string | null {
  return mark?.getAttribute('data-hue') ?? null;
}

function label(property: string): Element | null {
  return document.querySelector(`.found__label[data-property="${property}"]`);
}

function loop(property: string): Element | null {
  return document.querySelector(`.found[data-group="${property}"] .found__loop`);
}

function marksOn(concept: string, kind: string): Element[] {
  return [...screen.getByLabelText(concept).querySelectorAll(`.${kind}`)];
}

test('the two categories of one concept are named in two colours', () => {
  board('loops');
  point('ant');

  expect(hueOf(label('insect'))).not.toBeNull();
  expect(hueOf(label('insect'))).not.toBe(hueOf(label('underground')));
});

test('a name and the outline of its group are the same colour', () => {
  // The whole point: the word tells you which three bubbles it is about.
  board('loops');
  point('ant');

  expect(hueOf(loop('insect'))).not.toBeNull();
  expect(hueOf(loop('insect'))).toBe(hueOf(label('insect')));
});

test('a category nobody is pointing at keeps out of the colour code', () => {
  // `metal` is found, and ant is no part of it. Colouring it too would make
  // five loops shout where two were asked about.
  board('loops');
  point('ant');

  expect(hueOf(loop('metal'))).toBeNull();
});

test('nothing is coloured while nobody is pointing at anything', () => {
  board('loops');

  expect(document.querySelectorAll('[data-hue]')).toHaveLength(0);
});

test('the plain board wears no colour at all', () => {
  board('plain');
  point('ant');

  expect(document.querySelectorAll('[data-hue]')).toHaveLength(0);
});

test('a concept in two of the categories on show wears both arcs', () => {
  board('arcs');
  point('ant');

  expect(marksOn('ant', 'hue-arc').map(hueOf).sort()).toEqual(
    [hueOf(label('insect')), hueOf(label('underground'))].sort(),
  );
});

test('a concept in one of them wears that one arc and no other', () => {
  // bee is also in `metal`, which is not on show.
  board('arcs');
  point('ant');

  expect(marksOn('bee', 'hue-arc').map(hueOf)).toEqual([hueOf(label('insect'))]);
});

test('a concept in none of them wears no arc', () => {
  board('arcs');
  point('ant');

  expect(marksOn('coin', 'hue-arc')).toHaveLength(0);
});

test('two arcs on one concept are drawn as two slices of its ring', () => {
  board('arcs');
  point('ant');

  const dashes = marksOn('ant', 'hue-arc').map((arc) => arc.getAttribute('stroke-dasharray'));
  expect(new Set(dashes).size).toBe(1);
  expect(marksOn('ant', 'hue-arc').map((arc) => arc.getAttribute('stroke-dashoffset'))).not.toEqual(
    [dashes[0], dashes[0]],
  );
});

test('rings stack outwards rather than sitting on one another', () => {
  board('rings');
  point('ant');

  const radii = marksOn('ant', 'hue-ring').map((ring) => Number(ring.getAttribute('r')));
  expect(radii).toHaveLength(2);
  expect(radii[0]).not.toBe(radii[1]);
});

test('arcs and rings are never on the board at once', () => {
  board('rings');
  point('ant');

  expect(document.querySelectorAll('.hue-arc')).toHaveLength(0);
});

test('every category on the board is coloured when the board is asked for', () => {
  // ant is no part of `metal`, and its loop is coloured all the same: two
  // loops crossing between the same bubbles are one tangle until they differ.
  board('all-arcs');
  point('ant');

  expect(hueOf(loop('metal'))).not.toBeNull();
});

test('the categories of the concept pointed at are told from the rest', () => {
  board('all-arcs');
  point('ant');

  expect(loop('insect')).toHaveAttribute('data-near', 'true');
  expect(loop('metal')).toHaveAttribute('data-near', 'false');
});

test('and only they are marked on their bubbles', () => {
  // coin is in `metal` and nothing else. Its loop takes a colour; the bubble
  // takes nothing, or the mark stops meaning "this is what you asked about".
  board('all-arcs');
  point('ant');

  expect(marksOn('coin', 'hue-arc')).toHaveLength(0);
  expect(marksOn('ant', 'hue-arc')).toHaveLength(2);
});

test('a far category never takes a colour one of the near ones is using', () => {
  board('all-arcs');
  point('ant');

  expect(hueOf(loop('metal'))).not.toBe(hueOf(loop('insect')));
  expect(hueOf(loop('metal'))).not.toBe(hueOf(loop('underground')));
});

test('the whole board can be coloured with rings on it too', () => {
  board('all-rings');
  point('ant');

  expect(hueOf(loop('metal'))).not.toBeNull();
  expect(marksOn('ant', 'hue-ring')).toHaveLength(2);
  expect(marksOn('coin', 'hue-ring')).toHaveLength(0);
});

test('the whole board says its names when the whole board is coloured', () => {
  // A colour with no word against it is a colour nobody can read. If every
  // loop is lit, every loop says what it is.
  board('all-arcs');
  point('ant');

  expect(label('metal')).not.toBeNull();
  expect(hueOf(label('metal'))).toBe(hueOf(loop('metal')));
});

test('and the names say which of them the pointer is about', () => {
  board('all-arcs');
  point('ant');

  expect(label('insect')).toHaveAttribute('data-near', 'true');
  expect(label('metal')).toHaveAttribute('data-near', 'false');
});

test('a reveal about one concept still names only its own categories', () => {
  board('arcs');
  point('ant');

  expect(label('metal')).toBeNull();
});
