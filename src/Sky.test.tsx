import { render } from '@testing-library/react'
import { act } from 'react'
import Sky from './Sky'
import { PALETTES } from './sky/palettes'

function sky() {
  return document.querySelector('.sky') as HTMLElement;
}

/** The offset is written on the next frame, so wait for one. */
function frame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

afterEach(() => vi.unstubAllGlobals());

test('it wears the palette it was given', () => {
  render(<Sky palette={PALETTES[2].id} />);

  expect(sky().dataset.palette).toBe(PALETTES[2].id);
});

test('the aurora is drawn as separate washes, so they can drift apart', () => {
  render(<Sky palette={PALETTES[0].id} />);

  expect(document.querySelectorAll('.sky__wash')).toHaveLength(3);
});

test('it cannot catch a click meant for a bubble', () => {
  render(<Sky palette={PALETTES[0].id} />);

  expect(getComputedStyle(sky()).pointerEvents).toBe('none');
});

test('the pointer shifts the aurora, without a re-render', async () => {
  let renders = 0;
  function Counting() {
    renders++;
    return <Sky palette={PALETTES[0].id} />;
  }
  render(<Counting />);
  const drawn = renders;

  await act(async () => {
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 900, clientY: 300 }));
    await frame();
  });

  // Written straight onto the element: an animated background that re-rendered
  // React would drag the board down with it.
  expect(sky().style.getPropertyValue('--sky-x')).not.toBe('');
  expect(renders).toBe(drawn);
});

test('a player who asked for less motion gets a still sky', async () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  render(<Sky palette={PALETTES[0].id} />);

  expect(sky().dataset.still).toBe('true');

  await act(async () => {
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 900, clientY: 300 }));
    await frame();
  });
  expect(sky().style.getPropertyValue('--sky-x')).toBe('');
});
