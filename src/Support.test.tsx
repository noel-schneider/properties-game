import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './test-utils'
import { SupportLink, SupportInvite } from './Support'
import { SUPPORT_URL } from './supporting'

test('the quiet way in is always there, and goes to the right place', () => {
  renderApp(<SupportLink />);

  const link = screen.getByRole('link', { name: /support the game/i });
  expect(link).toHaveAttribute('href', SUPPORT_URL);
});

test('it opens elsewhere, so a game in progress is not thrown away', () => {
  renderApp(<SupportLink />);
  const link = screen.getByRole('link', { name: /support the game/i });

  expect(link).toHaveAttribute('target', '_blank');
  // Without this the page it opens can reach back into this one.
  expect(link.getAttribute('rel')).toContain('noopener');
  expect(link.getAttribute('rel')).toContain('noreferrer');
});

test('the invitation can be waved away, and says so', async () => {
  const dismissed: true[] = [];
  const user = userEvent.setup();
  renderApp(<SupportInvite onDismiss={() => dismissed.push(true)} />);

  await user.click(screen.getByRole('button', { name: /no thanks/i }));
  expect(dismissed).toEqual([true]);
});

test('the invitation never blocks the board', () => {
  // It is a note, not a door: a player who ignores it keeps playing.
  renderApp(<SupportInvite onDismiss={() => {}} />);

  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('status')).toBeInTheDocument();
});
