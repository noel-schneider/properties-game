import { act } from '@testing-library/react'
import { renderApp } from './test-utils'
import Sky from './Sky'
import { chordStruck } from './pulse'

test('the light from the surface swells when a chord lands, and says how big it was', () => {
  renderApp(<Sky />);
  const glow = document.querySelector('.sky__pulse')!;

  expect(glow.getAttribute('data-beat')).toBe('0');

  act(() => { chordStruck(3); });
  expect(glow.getAttribute('data-beat')).toBe('1');
  expect(glow.getAttribute('data-parts')).toBe('3');

  act(() => { chordStruck(5); });
  expect(glow.getAttribute('data-beat')).toBe('2');
  expect(glow.getAttribute('data-parts')).toBe('5');
});

test('it stops listening once it is gone', () => {
  const { unmount } = renderApp(<Sky />);
  unmount();

  expect(() => chordStruck(1)).not.toThrow();
});
