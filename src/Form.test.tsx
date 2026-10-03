import { screen } from '@testing-library/react'
import { renderApp } from './test-utils';
import userEvent from '@testing-library/user-event';
import Form from './Form';

test('submit stays disabled until three concepts and a category are given', async () => {
  const user = userEvent.setup();
  const { rerender } = renderApp(<Form selected={[]} feedback="none" onSubmit={() => true} />);

  const submit = screen.getByRole('button', { name: /submit/i });
  expect(submit).toBeDisabled();

  await user.type(screen.getByPlaceholderText(/type a category here/i), 'biome');
  expect(submit).toBeDisabled();

  rerender(<Form selected={['forest', 'desert']} feedback="none" onSubmit={() => true} />);
  expect(submit).toBeDisabled();

  rerender(<Form selected={['forest', 'desert', 'jungle']} feedback="none" onSubmit={() => true} />);
  expect(submit).toBeEnabled();
});

test('whitespace alone is not a category', async () => {
  const user = userEvent.setup();
  renderApp(<Form selected={['forest', 'desert', 'jungle']} feedback="none" onSubmit={() => true} />);

  await user.type(screen.getByPlaceholderText(/type a category here/i), '   ');
  expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
});

describe('reaching the input with the keyboard', () => {
  test('pressing enter puts the cursor in the box', async () => {
    const user = userEvent.setup();
    renderApp(<Form selected={[]} feedback="none" onSubmit={() => true} />);

    await user.keyboard('{Enter}');

    expect(screen.getByPlaceholderText(/type a category here/i)).toHaveFocus();
  });

  test('enter in the box still submits, rather than only refocusing it', async () => {
    const user = userEvent.setup();
    const guesses: string[] = [];
    renderApp(
      <Form
        selected={['a', 'b', 'c']}
        feedback="none"
        onSubmit={(guess) => { guesses.push(guess); return true; }}
      />,
    );

    const input = screen.getByPlaceholderText(/type a category here/i);
    await user.click(input);
    await user.type(input, 'insect{Enter}');

    expect(guesses).toEqual(['insect']);
  });

  test('a dialog keeps the enter key, so the box cannot steal it', async () => {
    const user = userEvent.setup();
    renderApp(
      <>
        <Form selected={[]} feedback="none" onSubmit={() => true} />
        <div role="dialog" aria-modal="true" aria-label="are you sure">
          <button type="button">Confirm</button>
        </div>
      </>,
    );

    await user.keyboard('{Enter}');

    expect(screen.getByPlaceholderText(/type a category here/i)).not.toHaveFocus();
  });
});
