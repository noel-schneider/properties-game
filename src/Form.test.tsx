import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Form from './Form';

test('submit stays disabled until three concepts and a category are given', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<Form selected={[]} />);

  const submit = screen.getByRole('button', { name: /submit/i });
  expect(submit).toBeDisabled();

  await user.type(screen.getByPlaceholderText(/type a category here/i), 'biome');
  expect(submit).toBeDisabled();

  rerender(<Form selected={['forest', 'desert']} />);
  expect(submit).toBeDisabled();

  rerender(<Form selected={['forest', 'desert', 'jungle']} />);
  expect(submit).toBeEnabled();
});

test('whitespace alone is not a category', async () => {
  const user = userEvent.setup();
  render(<Form selected={['forest', 'desert', 'jungle']} />);

  await user.type(screen.getByPlaceholderText(/type a category here/i), '   ');
  expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
});
