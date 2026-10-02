import { render } from '@testing-library/react'
import Sky from './Sky'

function sky() {
  return document.querySelector('.sky') as HTMLElement;
}

afterEach(() => vi.unstubAllGlobals());

test('the halo is built from two layers, so it has a warm core and a soft spill', () => {
  render(<Sky />);

  expect(document.querySelectorAll('.sky__glow')).toHaveLength(2);
});

test('it cannot catch a click meant for a bubble', () => {
  render(<Sky />);

  expect(getComputedStyle(sky()).pointerEvents).toBe('none');
});

test('a player who asked for less motion gets a still sky', () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  render(<Sky />);

  expect(sky().dataset.still).toBe('true');
});
