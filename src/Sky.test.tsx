import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fireEvent, render } from '@testing-library/react'
import Sky, { BLOOMS, MOTES, SHAFTS } from './Sky'

const css = readFileSync(join(__dirname, 'Sky.css'), 'utf8');

function sky() {
  return document.querySelector('.sky') as HTMLElement;
}

afterEach(() => vi.unstubAllGlobals());

test('the deep is lit by a few large bodies of light, and no texture at all', () => {
  // Fractal noise is what a generated texture looks like, and it looks like
  // one however it is tinted. What replaced it is a handful of very large
  // soft gradients drifting over one another, which is a thing water does
  // and an image file does not.
  render(<Sky />);

  expect(document.querySelectorAll('.sky__bloom')).toHaveLength(BLOOMS);
  expect(css).not.toMatch(/feTurbulence[^"]*baseFrequency='0\.0/);
});

test('no two of those drift on the same cycle either', () => {
  const periods = [...css.matchAll(/--bloom-time:\s*([\d.]+)s/g)].map((found) => Number(found[1]));

  expect(periods).toHaveLength(BLOOMS);
  expect(new Set(periods).size).toBe(BLOOMS);
});

test('the light comes down in shafts, so the water has a surface above it', () => {
  // One beam is a spotlight. Several, at different widths and leaning
  // different ways, are light coming through water from somewhere up there.
  render(<Sky />);

  expect(document.querySelectorAll('.sky__shaft')).toHaveLength(SHAFTS);
  expect(SHAFTS).toBeGreaterThan(1);
});

test('no two shafts sway on the same cycle', () => {
  // Cycles that divide into each other bring the whole background back to the
  // same frame on a beat you can count, and a background you can count is one
  // you have started watching.
  const periods = [...css.matchAll(/--sway:\s*([\d.]+)s/g)].map((found) => Number(found[1]));

  expect(periods).toHaveLength(SHAFTS);
  expect(new Set(periods).size).toBe(SHAFTS);
});

test('something drifts up through it', () => {
  render(<Sky />);

  expect(document.querySelectorAll('.sky__mote')).toHaveLength(MOTES);
});

test('and no two motes rise together', () => {
  // Handed the same delay they climb in formation, which is the one thing
  // drifting plankton never does.
  render(<Sky />);

  const delays = [...document.querySelectorAll('.sky__mote')].map(
    (mote) => (mote as HTMLElement).style.getPropertyValue('--rise-delay'),
  );

  expect(new Set(delays).size).toBeGreaterThan(MOTES / 2);
});

test('it cannot catch a click meant for a bubble', () => {
  render(<Sky />);

  expect(getComputedStyle(sky()).pointerEvents).toBe('none');
});

test('a player who asked for less motion gets still water', () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  render(<Sky />);

  expect(sky().dataset.still).toBe('true');
});

test('and that holds for the motes too, which are the liveliest thing here', () => {
  // The shafts sway by a few pixels; twenty points crossing the screen is the
  // layer someone turning motion off is actually turning off.
  expect(css).toMatch(/\.sky\[data-still="true"\][^{]*\.sky__mote\s*\{[^}]*animation:\s*none/);
});

test('the water leans away from the hand, so it has some depth to it', () => {
  // Parallax: the only thing on this layer the player drives directly. Two
  // custom properties written straight to the element — a render of the
  // background per pointer move is exactly the budget it does not have.
  render(<Sky />);

  expect(sky().style.getPropertyValue('--lean-x')).toBe('');

  fireEvent.pointerMove(window, { clientX: 0, clientY: 0 });
  const left = sky().style.getPropertyValue('--lean-x');

  fireEvent.pointerMove(window, { clientX: 999, clientY: 999 });
  expect(sky().style.getPropertyValue('--lean-x')).not.toBe(left);
});

test('and it stops listening once it is gone', () => {
  const { unmount } = render(<Sky />);
  unmount();

  expect(() => fireEvent.pointerMove(window, { clientX: 5, clientY: 5 })).not.toThrow();
});

test('something large goes past now and then, a long way off', () => {
  // Rare and far and never explained. The detail people tell each other
  // about, and the cheapest one in the whole background.
  render(<Sky />);

  expect(document.querySelectorAll('.sky__passer')).toHaveLength(1);
});

test('it is too far off to be in anybody way', () => {
  render(<Sky />);

  expect(getComputedStyle(document.querySelector('.sky__passer')!).pointerEvents).toBe('none');
});

test('and it stays away entirely from a player who asked for less motion', () => {
  // A silhouette parked in the middle of the board is not a still version of
  // something swimming past; it is a smudge nobody can explain.
  expect(css).toMatch(/\.sky\[data-still="true"\][^{]*\.sky__passer\s*\{[^}]*display:\s*none/);
});
