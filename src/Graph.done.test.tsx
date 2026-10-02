import { screen } from '@testing-library/react'
import { renderApp } from './test-utils'
import Graph, { ASIDE_GAP, asideLabel, FINISHED_RADIUS } from './Graph'
import { VIEW_WIDTH } from './useBubbleLayout'
import type { Solution } from './hand'
import type { Concept } from './types'

// a, b and c are finished by the group below. d, e and f keep a property the
// three of them still share, so they stay full size.
const concepts: Concept[] = [
  ...['a', 'b', 'c'].map((name) => ({ name, properties: ['thing'] })),
  ...['d', 'e', 'f'].map((name) => ({ name, properties: ['other'] })),
  // A second finished group, so there is a spent concept that shares nothing
  // with the first — which is what a reveal has to step back.
  ...['g', 'h', 'i'].map((name) => ({ name, properties: ['third'] })),
];
const found: Solution[] = [
  { property: 'thing', concepts: ['a', 'b', 'c'] },
  { property: 'third', concepts: ['g', 'h', 'i'] },
];

function board() {
  return renderApp(<Graph concepts={concepts} selected={[]} found={found} onToggle={() => {}} />);
}

/** The name of a spent concept, which is drawn beside its dot rather than in it. */
function asideNameOf(name: string) {
  return [...document.querySelectorAll('.bubble__name--aside')]
    .find((label) => label.textContent === name) as SVGTextElement | undefined;
}

test('a concept with nothing left to find keeps its name', () => {
  // The name is no use for forming a group — nothing shrunken can join one —
  // but it is what reminds the player which categories are in play.
  board();

  expect(screen.getByLabelText('a')).toHaveAttribute('data-found', 'true');
  expect(asideNameOf('a')).toBeDefined();
});

test('its name sits beside the dot rather than inside it', () => {
  board();

  const dot = screen.getByLabelText('a');
  const [dotX] = dot.getAttribute('transform')!.match(/-?\d+\.?\d*/g)!.map(Number);
  const labelX = Number(asideNameOf('a')!.getAttribute('x'));

  // Clear of the dot, on one side or the other.
  expect(Math.abs(labelX - dotX)).toBeGreaterThanOrEqual(FINISHED_RADIUS);
});

test('a concept still in play keeps its name inside, as before', () => {
  board();

  const label = screen.getByLabelText('d').querySelector('text')!;
  expect(label.classList.contains('bubble__name--aside')).toBe(false);
  expect(label.getAttribute('x')).toBeNull();
});

test('the name takes the side of the dot that has room for it', () => {
  // Against the right wall it would run off the frame, so it goes left.
  const atRightWall = asideLabel(VIEW_WIDTH / 2 - 20, FINISHED_RADIUS);
  expect(atRightWall.dx).toBeLessThan(0);
  expect(atRightWall.anchor).toBe('end');

  const inTheOpen = asideLabel(0, FINISHED_RADIUS);
  expect(inTheOpen.dx).toBe(FINISHED_RADIUS + ASIDE_GAP);
  expect(inTheOpen.anchor).toBe('start');
});

test('the name beside a dot is actually legible', () => {
  // `.bubble text` is the more specific selector, so this rule has to beat it
  // or the name is painted in the contour's near-black on a near-black board —
  // present in the DOM, invisible on screen.
  board();

  const style = getComputedStyle(asideNameOf('a')!);

  expect(style.fill).not.toBe('#1b1b1b');
  expect(Number.parseFloat(style.fontSize)).toBeLessThan(17);
});

test('the names of spent concepts are drawn after every bubble', () => {
  // A spent dot usually ends up tucked between full-size bubbles, and anything
  // drawn before them is painted over: the name has to come last or it is only
  // legible when nothing happens to be next to it.
  board();

  const svg = document.querySelector('.graph')!;
  const order = [...svg.querySelectorAll('.bubble, .bubble__name--aside')];
  const lastBubble = order.map((el) => el.classList.contains('bubble')).lastIndexOf(true);
  const firstName = order.findIndex((el) => el.classList.contains('bubble__name--aside'));

  expect(firstName).toBeGreaterThan(lastBubble);
});

test('a spent name steps back during a reveal, like everything else', async () => {
  const { fireEvent } = await import('@testing-library/react');
  board();

  // d is still in play and shares nothing found with a, b or c.
  fireEvent.pointerEnter(screen.getByLabelText('a'));

  // Drawn outside the bubble groups, these labels miss the dimming unless it
  // is applied to them too — and then they are the brightest thing on a board
  // that has just stepped back.
  expect(asideNameOf('g')?.classList.contains('bubble__name--muted')).toBe(true);
  expect(asideNameOf('b')?.classList.contains('bubble__name--muted')).toBe(false);
});
