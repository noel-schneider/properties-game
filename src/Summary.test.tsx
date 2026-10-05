import { screen } from '@testing-library/react'
import { renderApp } from './test-utils'
import userEvent from '@testing-library/user-event'
import Summary from './Summary'

const stats = { categories: 51, boards: 29, correct: 87, wrong: 12, bestStreak: 9, achievements: 11, totalAchievements: 15 };

test('celebrates the run and shows what it took', () => {
  renderApp(<Summary stats={stats} onPlayAgain={() => {}} onKeepPlaying={() => {}} />);

  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveTextContent(/every category/i);
  expect(dialog).toHaveTextContent('51');
  expect(dialog).toHaveTextContent('29');
  expect(dialog).toHaveTextContent('87');
  expect(dialog).toHaveTextContent('11 / 15');
});

test('offers a fresh run', async () => {
  const onPlayAgain = vi.fn();
  const user = userEvent.setup();
  renderApp(<Summary stats={stats} onPlayAgain={onPlayAgain} onKeepPlaying={() => {}} />);

  await user.click(screen.getByRole('button', { name: /play again/i }));
  expect(onPlayAgain).toHaveBeenCalled();
});

test('offers to carry on without ending', async () => {
  const onKeepPlaying = vi.fn();
  const user = userEvent.setup();
  renderApp(<Summary stats={stats} onPlayAgain={() => {}} onKeepPlaying={onKeepPlaying} />);

  await user.click(screen.getByRole('button', { name: /keep playing/i }));
  expect(onKeepPlaying).toHaveBeenCalled();
});

// The second half of the funding ask: the invite catches a player mid-run, and
// this catches the one who went all the way. A link, never a button — a button
// here would sit beside "play again" and compete with it.
test('thanks the player and leaves a way to give', () => {
  renderApp(<Summary stats={stats} onPlayAgain={() => {}} onKeepPlaying={() => {}} />);

  const give = screen.getByRole('link', { name: /buy a coffee/i });
  expect(give).toHaveAttribute('href', expect.stringContaining('ko-fi.com'));
  expect(give).toHaveAttribute('rel', 'noopener noreferrer');
});
