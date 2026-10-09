import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render } from '@testing-library/react'
import Sky, { MOTES, SHAFTS } from './Sky'

const css = readFileSync(join(__dirname, 'Sky.css'), 'utf8');

function sky() {
  return document.querySelector('.sky') as HTMLElement;
}

afterEach(() => vi.unstubAllGlobals());

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
