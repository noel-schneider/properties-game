import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './test-utils'
import App from './App'
import { SKIP_KEY } from './greeting'
import { HINT_SHOWN } from './hints'

beforeEach(() => localStorage.setItem(SKIP_KEY, 'true'));

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

/** Only the timeouts: faking the frame clock would freeze the board's layout. */
function freezeClock() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
}

function lit(): string[] {
  return [...document.querySelectorAll('.bubble--hinted')]
      .map((bubble) => bubble.getAttribute('aria-label')!)
      .sort();
}

function ask(): HTMLElement {
  return screen.getByRole('button', { name: /hint/i });
}

test('a board left alone is left alone, however long it sits', () => {
  // It used to light two concepts after forty-five seconds, and again every
  // twenty-five after that. A board that keeps pointing at things nobody asked
  // about reads as a tutorial rather than as a game.
  freezeClock();
  renderApp(<App playChime={() => {}} />);

  act(() => { vi.advanceTimersByTime(5 * 60_000); });

  expect(lit()).toEqual([]);
});

test('asking for a hint lights two concepts that go together', async () => {
  const user = userEvent.setup();
  renderApp(<App playChime={() => {}} />);

  await user.click(ask());

  const pair = lit();
  expect(pair).toHaveLength(2);

  // Both are still playable: a nudge towards a concept with nothing left in it
  // would be a nudge towards a dead end.
  for (const name of pair) {
    expect(document.querySelector(`.bubble[aria-label="${name}"]`))
        .toHaveAttribute('data-found', 'false');
  }
});

test('the hint goes by itself, so the board is not left marked', () => {
  freezeClock();
  renderApp(<App playChime={() => {}} />);

  act(() => { ask().click(); });
  expect(lit()).toHaveLength(2);

  act(() => { vi.advanceTimersByTime(HINT_SHOWN); });
  expect(lit()).toEqual([]);
});

test('asking again points somewhere else', () => {
  freezeClock();
  renderApp(<App playChime={() => {}} />);

  act(() => { ask().click(); });
  const first = lit();

  act(() => { vi.advanceTimersByTime(HINT_SHOWN); });
  act(() => { ask().click(); });

  expect(lit()).toHaveLength(2);
  expect(lit()).not.toEqual(first);
});
