import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Reset from './Reset'
import { renderApp } from './test-utils'

test('the button alone does not start anything over', async () => {
  const onReset = vi.fn();
  const user = userEvent.setup();
  renderApp(<Reset onReset={onReset} />);

  await user.click(screen.getByRole('button', { name: /start over/i }));

  expect(onReset).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog', { name: /start over/i })).toBeInTheDocument();
});

test('the confirmation says what is lost and what is kept', async () => {
  const user = userEvent.setup();
  renderApp(<Reset onReset={() => {}} />);

  await user.click(screen.getByRole('button', { name: /start over/i }));

  const dialog = screen.getByRole('dialog', { name: /start over/i });
  expect(dialog).toHaveTextContent(/cleared/i);
  expect(dialog).toHaveTextContent(/achievements/i);
});

test('confirming starts over', async () => {
  const onReset = vi.fn();
  const user = userEvent.setup();
  renderApp(<Reset onReset={onReset} />);

  await user.click(screen.getByRole('button', { name: /start over/i }));
  await user.click(screen.getByRole('button', { name: /clear and start over/i }));

  expect(onReset).toHaveBeenCalledTimes(1);
});

test('backing out changes nothing', async () => {
  const onReset = vi.fn();
  const user = userEvent.setup();
  renderApp(<Reset onReset={onReset} />);

  await user.click(screen.getByRole('button', { name: /start over/i }));
  await user.click(screen.getByRole('button', { name: /cancel/i }));

  expect(onReset).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('escape backs out too', async () => {
  const onReset = vi.fn();
  const user = userEvent.setup();
  renderApp(<Reset onReset={onReset} />);

  await user.click(screen.getByRole('button', { name: /start over/i }));
  await user.keyboard('{Escape}');

  expect(onReset).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).toBeNull();
});
