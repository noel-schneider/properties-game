import { act } from '@testing-library/react'
import { renderApp } from './test-utils'
import App from './App'
import { HINT_AGAIN, HINT_FIRST, HINT_SHOWN } from './hints'

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

test('a board that sits untouched says nothing for the first three quarters of a minute', () => {
  freezeClock();
  renderApp(<App playChime={() => {}} />);

  act(() => { vi.advanceTimersByTime(HINT_FIRST - 1_000); });
  expect(lit()).toEqual([]);
});

test('then two concepts light up, and go again shortly after', () => {
  freezeClock();
  renderApp(<App playChime={() => {}} />);

  act(() => { vi.advanceTimersByTime(HINT_FIRST); });
  expect(lit()).toHaveLength(2);

  act(() => { vi.advanceTimersByTime(HINT_SHOWN); });
  expect(lit()).toEqual([]);
});

test('the next nudge points somewhere else', () => {
  freezeClock();
  renderApp(<App playChime={() => {}} />);

  act(() => { vi.advanceTimersByTime(HINT_FIRST); });
  const first = lit();

  act(() => { vi.advanceTimersByTime(HINT_AGAIN); });
  const second = lit();

  expect(second).toHaveLength(2);
  expect(second).not.toEqual(first);
});

test('the two lit always share a category nobody has named yet', () => {
  freezeClock();
  renderApp(<App playChime={() => {}} />);

  act(() => { vi.advanceTimersByTime(HINT_FIRST); });
  const [a, b] = lit().map((name) => document.querySelector(`.bubble[aria-label="${name}"]`)!);

  // Both are still playable: a nudge towards a concept with nothing left in it
  // would be a nudge towards a dead end.
  expect(a.getAttribute('data-found')).toBe('false');
  expect(b.getAttribute('data-found')).toBe('false');
});
