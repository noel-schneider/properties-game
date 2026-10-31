import { act, screen } from '@testing-library/react'
import { renderApp } from './test-utils';
import userEvent from '@testing-library/user-event';
import Form, { VERDICT_SECONDS } from './Form';

test('submit stays disabled until a category is given', async () => {
  // There is no button at all before three are picked, so the two halves of
  // the condition are met in the order a player meets them.
  const user = userEvent.setup();
  renderApp(<Form selected={['forest', 'desert', 'jungle']} feedback="none" onSubmit={() => true} />);

  const submit = screen.getByRole('button', { name: /submit/i });
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
    renderApp(<Form selected={['a', 'b', 'c']} feedback="none" onSubmit={() => true} />);

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
        <Form selected={['a', 'b', 'c']} feedback="none" onSubmit={() => true} />
        <div role="dialog" aria-modal="true" aria-label="are you sure">
          <button type="button">Confirm</button>
        </div>
      </>,
    );

    await user.keyboard('{Enter}');

    expect(screen.getByRole('textbox')).not.toHaveFocus();
  });
});

describe('below three concepts', () => {
  test('there is no box yet, only a line saying what to pick', () => {
    // A box shown before it could be used was the first thing players went
    // for: they clicked into it and typed before picking anything.
    const { rerender } = renderApp(
        <Form selected={['bee', 'ant']} feedback="none" onSubmit={() => true} />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument();
    expect(screen.getByText(/1 more concept/i)).toBeInTheDocument();

    rerender(<Form selected={['bee', 'ant', 'beetle']} feedback="none" onSubmit={() => true} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', expect.stringMatching(/type a category/i));
    expect(screen.queryByText(/more concept/i)).not.toBeInTheDocument();
  });

  test('what was typed before the third went is kept, not thrown away', async () => {
    // Somebody types "insect", looks up, and unpicks a bubble to swap it. The
    // word they wrote is still the word they meant when the box comes back.
    const user = userEvent.setup();
    const { rerender } = renderApp(
        <Form selected={['bee', 'ant', 'beetle']} feedback="none" onSubmit={() => true} />);

    await user.type(screen.getByRole('textbox'), 'insect');
    rerender(<Form selected={['bee', 'ant']} feedback="none" onSubmit={() => true} />);
    rerender(<Form selected={['bee', 'ant', 'wasp']} feedback="none" onSubmit={() => true} />);

    expect(screen.getByRole('textbox')).toHaveValue('insect');
  });

  test('enter has nothing to reach, and does no harm', async () => {
    const user = userEvent.setup();
    renderApp(<Form selected={['bee']} feedback="none" onSubmit={() => true} />);

    await user.keyboard('{Enter}');

    expect(document.body).toHaveFocus();
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
    expect(screen.getByText(/2 more/i)).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});

test('the reminder counts down what is still to pick', () => {
  // "Pick three concepts" said the same thing with one picked as with none,
  // and a tester read it as an instruction about the box rather than about
  // the board. Counting down says both what to do and how far along it is.
  const { rerender } = renderApp(<Form selected={[]} feedback="none" onSubmit={() => true} />);
  expect(screen.getByText(/first.*3 concepts/i)).toBeInTheDocument();

  rerender(<Form selected={['bee']} feedback="none" onSubmit={() => true} />);
  expect(screen.getByText(/2 more concepts/i)).toBeInTheDocument();

  rerender(<Form selected={['bee', 'owl']} feedback="none" onSubmit={() => true} />);
  expect(screen.getByText(/1 more concept\b/i)).toBeInTheDocument();
});

test('three pips fill as concepts are picked, and go once there are three', () => {
  const pips = () => document.querySelectorAll('.pick-count__pip');
  const lit = () => document.querySelectorAll('.pick-count__pip--lit');
  const { rerender } = renderApp(<Form selected={[]} feedback="none" onSubmit={() => true} />);

  expect(pips()).toHaveLength(3);
  expect(lit()).toHaveLength(0);

  rerender(<Form selected={['bee', 'owl']} feedback="none" onSubmit={() => true} />);
  expect(lit()).toHaveLength(2);

  rerender(<Form selected={['bee', 'owl', 'turtle']} feedback="none" onSubmit={() => true} />);
  expect(pips()).toHaveLength(0);
});

test('the third pick brings the box with the cursor in it, ready to name them', () => {
  // Picking the third is the moment the player starts thinking of a name;
  // making them click the box first is a step between the thought and typing.
  const { rerender } = renderApp(<Form selected={['bee', 'owl']} feedback="none" onSubmit={() => true} />);

  rerender(<Form selected={['bee', 'owl', 'turtle']} feedback="none" onSubmit={() => true} />);
  expect(screen.getByRole('textbox')).toHaveFocus();
});

test('but only as the third arrives, not on every change after', () => {
  // A player who has clicked away from the box with three still picked has
  // somewhere else to be; nothing should pull the cursor back there.
  const { rerender } = renderApp(<Form selected={['bee', 'owl', 'turtle']} feedback="none" onSubmit={() => true} />);
  const box = screen.getByRole('textbox');
  box.blur();

  rerender(<Form selected={['bee', 'owl', 'turtle']} feedback="wrong" onSubmit={() => true} />);
  expect(box).not.toHaveFocus();
});
