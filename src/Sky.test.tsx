import { render } from '@testing-library/react'
import { act } from 'react'
import Sky, { STAR_LAYERS } from './Sky'

function sky() {
  return document.querySelector('.sky') as HTMLElement;
}

afterEach(() => vi.unstubAllGlobals());

test('the sky is drawn in layers, each with its own stars', () => {
  render(<Sky />);

  const layers = document.querySelectorAll('.sky__stars');
  expect(layers).toHaveLength(STAR_LAYERS.length);

  layers.forEach((layer, i) => {
    expect(layer.querySelectorAll('circle')).toHaveLength(STAR_LAYERS[i].count);
  });
});

test('the same sky comes back every time, so it never flickers between renders', () => {
  const { unmount } = render(<Sky />);
  const first = document.querySelector('.sky__stars')!.innerHTML;
  unmount();

  render(<Sky />);
  expect(document.querySelector('.sky__stars')!.innerHTML).toBe(first);
});

test('it cannot catch a click meant for a bubble', () => {
  render(<Sky />);

  expect(getComputedStyle(sky()).pointerEvents).toBe('none');
});

/** The offset is written on the next frame, so wait for one. */
function frame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

test('the pointer shifts the layers, without a re-render', async () => {
  let renders = 0;
  function Counting() {
    renders++;
    return <Sky />;
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
  render(<Sky />);

  expect(sky().dataset.still).toBe('true');

  await act(async () => {
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 900, clientY: 300 }));
    await frame();
  });
  expect(sky().style.getPropertyValue('--sky-x')).toBe('');
});
