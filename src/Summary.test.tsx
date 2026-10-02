import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Summary from './Summary'

const stats = { categories: 51, boards: 29, correct: 87, wrong: 12, bestStreak: 9, achievements: 11, totalAchievements: 15 };

test('celebrates the run and shows what it took', () => {
  render(<Summary stats={stats} onPlayAgain={() => {}} onKeepPlaying={() => {}} />);

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
  render(<Summary stats={stats} onPlayAgain={onPlayAgain} onKeepPlaying={() => {}} />);

  await user.click(screen.getByRole('button', { name: /play again/i }));
  expect(onPlayAgain).toHaveBeenCalled();
});

test('offers to carry on without ending', async () => {
  const onKeepPlaying = vi.fn();
  const user = userEvent.setup();
  render(<Summary stats={stats} onPlayAgain={() => {}} onKeepPlaying={onKeepPlaying} />);

  await user.click(screen.getByRole('button', { name: /keep playing/i }));
  expect(onKeepPlaying).toHaveBeenCalled();
});
