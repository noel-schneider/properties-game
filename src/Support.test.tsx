import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './test-utils'
import { SupportInvite } from './Support'

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
