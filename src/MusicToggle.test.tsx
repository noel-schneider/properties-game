import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './test-utils'
import MusicToggle from './MusicToggle'
import { loadMusic, saveMusic } from './achievements/storage'

afterEach(() => localStorage.clear());

test('music is on unless it has been turned off', () => {
  // It cannot start on its own — a browser refuses audio until somebody has
  // clicked something — so this means it begins on a player's first gesture
  // rather than waiting to be asked for.
  expect(loadMusic()).toBe(true);

  saveMusic(false);
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
