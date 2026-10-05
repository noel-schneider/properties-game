import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './test-utils'
import MusicToggle from './MusicToggle'
import { loadMusic, saveMusic } from './achievements/storage'

afterEach(() => localStorage.clear());

test('music is off until it is asked for', () => {
  // Music nobody asked for, starting on arrival, is the thing that makes
  // people close a tab.
  expect(loadMusic()).toBe(false);
});

test('the choice survives a reload', () => {
  saveMusic(true);
  expect(loadMusic()).toBe(true);
  saveMusic(false);
  expect(loadMusic()).toBe(false);
});

test('the button says which way it will go', async () => {
  const user = userEvent.setup();
  const calls: boolean[] = [];
  const { rerender } = renderApp(<MusicToggle playing={false} onToggle={() => calls.push(true)} />);

  await user.click(screen.getByRole('button', { name: /turn music on/i }));
  expect(calls).toEqual([true]);

  rerender(<MusicToggle playing onToggle={() => {}} />);
  expect(screen.getByRole('button', { name: /turn music off/i })).toBeInTheDocument();
});
