import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './test-utils'
import SoundNote, { NOTE_SECONDS } from './SoundNote'

test('it mentions the sound on arrival, without taking the board', () => {
  renderApp(<SoundNote muted={false} />);

  expect(screen.getByTestId('sound-note')).toHaveTextContent(/sound/i);
  // A note, not a door: nothing here is a dialog and nothing takes the keyboard.
  expect(screen.queryByRole('dialog')).toBeNull();
  // And not the board's own status line either, which answers guesses.
  expect(screen.queryByRole('status')).toBeNull();
});

test('it goes on its own, so nobody has to deal with it', () => {
  vi.useFakeTimers();
  try {
    renderApp(<SoundNote muted={false} />);
    expect(screen.getByTestId('sound-note')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(NOTE_SECONDS * 1000 + 100); });
    expect(screen.queryByTestId('sound-note')).toBeNull();
  } finally {
    vi.useRealTimers();
  }
});

test('it can be waved away', async () => {
  const user = userEvent.setup();
  renderApp(<SoundNote muted={false} />);

  await user.click(screen.getByRole('button'));
  expect(screen.queryByTestId('sound-note')).toBeNull();
});

test('a player who muted the game is not told to turn it on', () => {
  // They have already answered this question. Asking again is nagging.
  renderApp(<SoundNote muted />);

  expect(screen.queryByTestId('sound-note')).toBeNull();
});
