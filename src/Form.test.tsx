import { act, screen } from '@testing-library/react'
import { renderApp } from './test-utils';
import userEvent from '@testing-library/user-event';
import Form, { VERDICT_SECONDS } from './Form';

test('submit stays disabled until three concepts and a category are given', async () => {
  const user = userEvent.setup();
  const { rerender } = renderApp(<Form selected={[]} feedback="none" onSubmit={() => true} />);

  const submit = screen.getByRole('button', { name: /submit/i });
  expect(submit).toBeDisabled();

  // Nothing can be typed yet — the box is read only until three are picked —
  // so the two halves of the condition are met in the order a player meets them.
  rerender(<Form selected={['forest', 'desert']} feedback="none" onSubmit={() => true} />);
  expect(submit).toBeDisabled();

  rerender(<Form selected={['forest', 'desert', 'jungle']} feedback="none" onSubmit={() => true} />);
  expect(submit).toBeDisabled();

  await user.type(screen.getByRole('textbox'), 'biome');
  expect(submit).toBeEnabled();
});

test('whitespace alone is not a category', async () => {
  const user = userEvent.setup();
  renderApp(<Form selected={['forest', 'desert', 'jungle']} feedback="none" onSubmit={() => true} />);

  await user.type(screen.getByRole('textbox'), '   ');
  expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
});

describe('reaching the input with the keyboard', () => {
  test('pressing enter puts the cursor in the box', async () => {
    const user = userEvent.setup();
    renderApp(<Form selected={[]} feedback="none" onSubmit={() => true} />);

    await user.keyboard('{Enter}');

    expect(screen.getByRole('textbox')).toHaveFocus();
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

    const input = screen.getByRole('textbox');
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

    expect(screen.getByRole('textbox')).not.toHaveFocus();
  });
});

describe('the box below three concepts', () => {
  test('it cannot be typed in, and says so where the typing would go', () => {
    // A box that takes a category nobody can submit is a box that lies. Read
    // only rather than disabled: it still takes the focus, which is what the
    // enter shortcut and a keyboard player both need.
    const { rerender } = renderApp(
        <Form selected={['bee', 'ant']} feedback="none" onSubmit={() => true} />);

    const box = screen.getByRole('textbox');
    expect(box).toHaveAttribute('readonly');
    expect(box).toHaveAttribute('placeholder', expect.stringMatching(/three concepts/i));

    rerender(<Form selected={['bee', 'ant', 'beetle']} feedback="none" onSubmit={() => true} />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('readonly');
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', expect.stringMatching(/type a category/i));
  });

  test('what was typed before the third went is kept, not thrown away', async () => {
    // Somebody types "insect", looks up, and unpicks a bubble to swap it. The
    // word they wrote is still the word they meant.
    const user = userEvent.setup();
    const { rerender } = renderApp(
        <Form selected={['bee', 'ant', 'beetle']} feedback="none" onSubmit={() => true} />);

    await user.type(screen.getByRole('textbox'), 'insect');
    rerender(<Form selected={['bee', 'ant']} feedback="none" onSubmit={() => true} />);

    expect(screen.getByRole('textbox')).toHaveValue('insect');
  });

  test('it still takes the focus, so the enter shortcut is not lost', async () => {
    const user = userEvent.setup();
    renderApp(<Form selected={['bee']} feedback="none" onSubmit={() => true} />);

    await user.keyboard('{Enter}');

    expect(screen.getByRole('textbox')).toHaveFocus();
  });
});

test('an empty box is not nagged at', () => {
  // Picking one bubble and stopping is a normal thing to do; it is only once
  // somebody starts naming a category that the count is worth mentioning.
  renderApp(<Form selected={['bee']} feedback="none" onSubmit={() => true} />);

  expect(screen.getByRole('status')).toHaveTextContent('');
});

test('a verdict clears itself, so nothing hangs over the next answer', () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  try {
    const { rerender } = renderApp(<Form selected={[]} feedback="wrong" onSubmit={() => true} />);
    expect(screen.getByRole('status')).toHaveTextContent(/not a category/i);

    act(() => { vi.advanceTimersByTime(VERDICT_SECONDS * 1000 + 100); });
    expect(screen.getByRole('status')).toHaveTextContent('');

    // And a fresh verdict shows again, rather than being swallowed by the one
    // that just went.
    rerender(<Form selected={[]} feedback="correct" onSubmit={() => true} />);
    expect(screen.getByRole('status')).toHaveTextContent(/correct/i);
  } finally {
    vi.useRealTimers();
  }
});

test('the reminder is not on a clock, because the thing it describes is not', () => {
  // "Pick three concepts" stops being true the moment a third is picked, and
  // stays true until then however long that takes. Only verdicts expire.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  try {
    renderApp(<Form selected={['bee']} feedback="none" onSubmit={() => true} />);

    act(() => { vi.advanceTimersByTime(VERDICT_SECONDS * 1000 + 5_000); });
    expect(screen.getByRole('textbox'))
        .toHaveAttribute('placeholder', expect.stringMatching(/three concepts/i));
  } finally {
    vi.useRealTimers();
  }
});
