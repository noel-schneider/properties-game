import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('clicking three bubbles selects them and enables submit', async () => {
  const user = userEvent.setup();
  render(<App />);

  const bubbles = screen.getAllByRole('checkbox');
  expect(bubbles).toHaveLength(15);

  const submit = screen.getByRole('button', { name: /submit/i });
  await user.type(screen.getByPlaceholderText(/type a category here/i), 'biome');
  expect(submit).toBeDisabled();

  for (const bubble of bubbles.slice(0, 3)) {
    await user.click(bubble);
  }

  for (const bubble of bubbles.slice(0, 3)) {
    expect(bubble).toHaveAttribute('aria-checked', 'true');
  }
  expect(submit).toBeEnabled();
});

test('clicking a selected bubble again deselects it', async () => {
  const user = userEvent.setup();
  render(<App />);

  const bubble = screen.getAllByRole('checkbox')[0];
  expect(bubble).toHaveAttribute('aria-checked', 'false');

  await user.click(bubble);
  expect(bubble).toHaveAttribute('aria-checked', 'true');

  await user.click(bubble);
  expect(bubble).toHaveAttribute('aria-checked', 'false');
});
