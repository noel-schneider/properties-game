import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './test-utils'
import App from './App'
import { SKIP_KEY } from './greeting'
import Graph from './Graph'
import type { Concept } from './types'

const concepts: Concept[] = Array.from({ length: 9 }, (_, i) => ({
  name: `concept-${i}`,
  properties: ['thing', `pair-${i % 3}`],
}));

/** The board itself, which is what a click has to land on to mean "nothing". */
function board(): SVGSVGElement {
  return document.querySelector('svg.graph')!;
}

describe('the board asks for a clean slate', () => {
  test('a click on the empty board clears the selection', () => {
    const cleared: boolean[] = [];
    renderApp(
      <Graph concepts={concepts} selected={['concept-0']} found={[]}
             onToggle={() => {}} onClear={() => cleared.push(true)} />);

    fireEvent.click(board());

    expect(cleared).toEqual([true]);
  });

  test('a click on a bubble is not a click on the board', () => {
    // The click bubbles up to the board, so without telling the two apart
    // every pick would be undone by its own event on the way out.
    const cleared: boolean[] = [];
    const picked: string[] = [];
    renderApp(
      <Graph concepts={concepts} selected={[]} found={[]}
             onToggle={(name) => picked.push(name)} onClear={() => cleared.push(true)} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'concept-0' }));

    expect(picked).toEqual(['concept-0']);
    expect(cleared).toEqual([]);
  });
});

describe('in the game', () => {
  // The rules card is shown on arrival and is a modal, which is exactly what
  // the escape key belongs to while it is open. These tests are about the
  // board behind it.
  beforeEach(() => localStorage.setItem(SKIP_KEY, 'true'));
  afterEach(() => localStorage.clear());

  test('clicking the board puts every bubble back', async () => {
    const user = userEvent.setup();
    renderApp(<App playChime={() => {}} />);

    const bubbles = screen.getAllByRole('checkbox');
    await user.click(bubbles[0]);
    await user.click(bubbles[1]);
    expect(bubbles[0]).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(board());

    expect(bubbles[0]).toHaveAttribute('aria-checked', 'false');
    expect(bubbles[1]).toHaveAttribute('aria-checked', 'false');
  });

  test('escape puts every bubble back too, for a hand already on the keyboard', async () => {
    const user = userEvent.setup();
    renderApp(<App playChime={() => {}} />);

    const bubbles = screen.getAllByRole('checkbox');
    await user.click(bubbles[0]);
    await user.click(bubbles[1]);

    act(() => { fireEvent.keyDown(document, { key: 'Escape' }); });

    expect(bubbles[0]).toHaveAttribute('aria-checked', 'false');
    expect(bubbles[1]).toHaveAttribute('aria-checked', 'false');
  });

  test('escape belongs to a dialog while one is open', async () => {
    // The greeting is the first thing a player meets, and its own escape
    // closes it. Two things answering one key is one of them going wrong.
    const user = userEvent.setup();
    renderApp(<App playChime={() => {}} />);

    const bubbles = screen.getAllByRole('checkbox');
    await user.click(bubbles[0]);
    await user.click(screen.getByRole('button', { name: /start over/i }));
    expect(screen.getByRole('dialog', { name: /start over/i })).toBeInTheDocument();

    act(() => { fireEvent.keyDown(document, { key: 'Escape' }); });

    expect(bubbles[0]).toHaveAttribute('aria-checked', 'true');
  });
});
