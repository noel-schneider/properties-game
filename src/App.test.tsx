import { screen } from '@testing-library/react'
import { formableGroupsOnScreen, renderApp } from './test-utils';
import userEvent from '@testing-library/user-event';
import App from './App';
import { getAllConcepts } from './concepts';
import { sharedProperties } from './guess';
import type { Concept } from './types';

const byName = new Map(getAllConcepts().map((c) => [c.name, c]));

afterEach(() => localStorage.clear());

/** The concepts on screen, in the order they are rendered. */
function dealtConcepts(): Concept[] {
  return screen
    .getAllByRole('checkbox')
    .map((bubble) => byName.get(bubble.getAttribute('aria-label')!)!);
}

/** Three dealt concepts that share a property, plus that property. */
function findSolvableTriple(): { concepts: Concept[]; property: string } {
  const dealt = dealtConcepts();

  for (let a = 0; a < dealt.length; a++) {
    for (let b = a + 1; b < dealt.length; b++) {
      for (let c = b + 1; c < dealt.length; c++) {
        const triple = [dealt[a], dealt[b], dealt[c]];
        const [property] = sharedProperties(triple);
        if (property) return { concepts: triple, property };
      }
    }
  }

  throw new Error('the dealt hand has no solvable triple, which dealHand should prevent');
}

async function select(user: ReturnType<typeof userEvent.setup>, concepts: Concept[]) {
  for (const concept of concepts) {
    await user.click(screen.getByRole('checkbox', { name: concept.name }));
  }
}

test('clicking three bubbles selects them and enables submit', async () => {
  const user = userEvent.setup();
  renderApp(<App />);

  const bubbles = screen.getAllByRole('checkbox');
  // The board is dealt to a number of moves available rather than a number of
  // concepts, so how many bubbles that takes is not fixed. What must hold is
  // that there is enough on it to make a guess with.
  expect(bubbles.length).toBeGreaterThanOrEqual(3);

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
  renderApp(<App />);

  const bubble = screen.getAllByRole('checkbox')[0];
  expect(bubble).toHaveAttribute('aria-checked', 'false');

  await user.click(bubble);
  expect(bubble).toHaveAttribute('aria-checked', 'true');

  await user.click(bubble);
  expect(bubble).toHaveAttribute('aria-checked', 'false');
});

test('the dealt hand always contains a solvable triple', () => {
  renderApp(<App />);

  expect(() => findSolvableTriple()).not.toThrow();
});

test('naming the category the selected concepts share is accepted', async () => {
  const user = userEvent.setup();
  renderApp(<App />);

  const { concepts, property } = findSolvableTriple();
  await select(user, concepts);
  await user.type(screen.getByPlaceholderText(/type a category here/i), property);
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/correct/i);
});

test('naming a category the selected concepts do not share is rejected', async () => {
  const user = userEvent.setup();
  renderApp(<App />);

  const { concepts } = findSolvableTriple();
  await select(user, concepts);
  await user.type(
    screen.getByPlaceholderText(/type a category here/i),
    'definitely not a real category',
  );
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/not quite/i);
});

test('a correct answer keeps the found concepts on the board and scores a point', async () => {
  const user = userEvent.setup();
  renderApp(<App />);

  const { concepts, property } = findSolvableTriple();
  await select(user, concepts);
  await user.type(screen.getByPlaceholderText(/type a category here/i), property);
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/correct/i);
  expect(screen.getByTestId('found')).toHaveTextContent('1');

  // They stay on the board and can still be used for their other properties.
  for (const concept of concepts) {
    expect(screen.getByLabelText(concept.name)).toBeInTheDocument();
  }
});

test('a wrong answer leaves the board and the score alone', async () => {
  const user = userEvent.setup();
  renderApp(<App />);

  const before = screen.getAllByRole('checkbox').map((b) => b.getAttribute('aria-label'));
  const { concepts } = findSolvableTriple();
  await select(user, concepts);
  await user.type(screen.getByPlaceholderText(/type a category here/i), 'not a category');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/not quite/i);
  expect(screen.getByTestId('found')).toHaveTextContent('0');
  expect(screen.getAllByRole('checkbox').map((b) => b.getAttribute('aria-label'))).toEqual(before);
});

test('a correct answer clears the selection and the input', async () => {
  const user = userEvent.setup();
  renderApp(<App />);

  const { concepts, property } = findSolvableTriple();
  await select(user, concepts);
  const input = screen.getByPlaceholderText(/type a category here/i);
  await user.type(input, property);
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/correct/i);
  expect(input).toHaveValue('');
  for (const bubble of screen.getAllByRole('checkbox')) {
    expect(bubble).toHaveAttribute('aria-checked', 'false');
  }
});

test('a wrong answer keeps what you typed so it can be reworded', async () => {
  const user = userEvent.setup();
  renderApp(<App />);

  const { concepts } = findSolvableTriple();
  await select(user, concepts);
  const input = screen.getByPlaceholderText(/type a category here/i);
  await user.type(input, 'wrong on purpose');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/not quite/i);
  expect(input).toHaveValue('wrong on purpose');
});

test('the first category found unlocks First Light, with the chime', async () => {
  const chime = vi.fn();
  const user = userEvent.setup();
  renderApp(<App playChime={chime} />);

  const { concepts, property } = findSolvableTriple();
  await select(user, concepts);
  await user.type(screen.getByPlaceholderText(/type a category here/i), property);
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // Quickdraw lands too: the test answers well within ten seconds.
  const announcements = await screen.findAllByRole('alert');
  expect(announcements.map((a) => a.textContent).join(' ')).toContain('First Light');
  expect(chime).toHaveBeenCalledTimes(1);
});

test('a wrong answer unlocks nothing and stays silent', async () => {
  const chime = vi.fn();
  const user = userEvent.setup();
  renderApp(<App playChime={chime} />);

  const { concepts } = findSolvableTriple();
  await select(user, concepts);
  await user.type(screen.getByPlaceholderText(/type a category here/i), 'not a category');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/not quite/i);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(chime).not.toHaveBeenCalled();
});

test('an achievement earned before is not announced again on a later run', async () => {
  const user = userEvent.setup();
  const { unmount } = renderApp(<App playChime={() => {}} />);

  const first = findSolvableTriple();
  await select(user, first.concepts);
  await user.type(screen.getByPlaceholderText(/type a category here/i), first.property);
  await user.click(screen.getByRole('button', { name: /submit/i }));
  expect((await screen.findAllByRole('alert')).map((a) => a.textContent).join(' ')).toContain('First Light');
  unmount();

  renderApp(<App playChime={() => {}} />);
  const again = formableGroupsOnScreen()[0];
  for (const name of again.concepts) {
    await user.click(screen.getByRole('checkbox', { name }));
  }
  await user.type(screen.getByPlaceholderText(/type a category here/i), again.property);
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/correct/i);
  // Not "no announcement at all": the second group may finish a concept on its
  // way past and earn Hat-trick, which is a different achievement being earned
  // for the first time. What must not come back is the one already earned.
  const announced = screen.queryAllByRole('alert').map((a) => a.textContent).join(' ');
  expect(announced).not.toContain('First Light');
});

test('the achievements button counts what has been earned', async () => {
  const user = userEvent.setup();
  renderApp(<App playChime={() => {}} />);

  const button = screen.getByRole('button', { name: /achievements/i });
  // Read rather than assumed to be zero: one achievement is earned simply by
  // playing between two and four in the morning, so a suite that expects none
  // at the start fails for two hours every night.
  const earned = () => Number(button.textContent!.match(/(\d+)\s*\//)![1]);
  const before = earned();

  const { concepts, property } = findSolvableTriple();
  await select(user, concepts);
  await user.type(screen.getByPlaceholderText(/type a category here/i), property);
  await user.click(screen.getByRole('button', { name: /submit/i }));

  await screen.findAllByRole('alert');
  expect(earned()).toBeGreaterThan(before);
});

test('muting the sound silences the next unlock, and is remembered', async () => {
  const chime = vi.fn();
  const user = userEvent.setup();
  const { unmount } = renderApp(<App playChime={chime} />);

  await user.click(screen.getByRole('button', { name: /mute achievement sound/i }));

  const { concepts, property } = findSolvableTriple();
  await select(user, concepts);
  await user.type(screen.getByPlaceholderText(/type a category here/i), property);
  await user.click(screen.getByRole('button', { name: /submit/i }));

  await screen.findAllByRole('alert');
  expect(chime).not.toHaveBeenCalled();

  unmount();
  renderApp(<App playChime={() => {}} />);
  expect(screen.getByRole('button', { name: /unmute achievement sound/i })).toBeInTheDocument();
});








test('starting over clears what was found and keeps the achievements', async () => {
  const user = userEvent.setup();
  renderApp(<App playChime={() => {}} />);

  const group = formableGroupsOnScreen()[0];
  for (const name of group.concepts) {
    await user.click(screen.getByRole('checkbox', { name }));
  }
  await user.type(screen.getByPlaceholderText(/type a category here/i), group.property);
  await user.click(screen.getByRole('button', { name: /submit/i }));
  await screen.findByRole('status');

  expect(screen.getByTestId('found')).toHaveTextContent('1');
  const earned = screen.getByRole('button', { name: /achievements/i }).textContent;

  await user.click(screen.getByRole('button', { name: /start over/i }));
  await user.click(screen.getByRole('button', { name: /clear and start over/i }));

  expect(screen.getByTestId('found')).toHaveTextContent('0');
  expect(screen.getByRole('button', { name: /achievements/i })).toHaveTextContent(earned!);
});

test('backing out of starting over leaves the game alone', async () => {
  const user = userEvent.setup();
  renderApp(<App playChime={() => {}} />);

  const group = formableGroupsOnScreen()[0];
  for (const name of group.concepts) {
    await user.click(screen.getByRole('checkbox', { name }));
  }
  await user.type(screen.getByPlaceholderText(/type a category here/i), group.property);
  await user.click(screen.getByRole('button', { name: /submit/i }));
  await screen.findByRole('status');

  await user.click(screen.getByRole('button', { name: /start over/i }));
  await user.click(screen.getByRole('button', { name: /cancel/i }));

  expect(screen.getByTestId('found')).toHaveTextContent('1');
});

test('the controls sit where they belong: achievements low, the rest high', () => {
  renderApp(<App playChime={() => {}} />);

  const top = document.querySelector('.corner--top-right')!;
  const bottom = document.querySelector('.corner--bottom-right')!;

  expect(bottom).toContainElement(screen.getByRole('button', { name: /achievements/i }));
  for (const name of [/switch to english/i, /start over/i, /mute achievement sound/i]) {
    expect(top).toContainElement(screen.getByRole('button', { name }));
  }
});

test('the sound test button is gone', () => {
  renderApp(<App playChime={() => {}} />);

  expect(screen.queryByRole('button', { name: /hear the achievement sound/i })).toBeNull();
});

describe('the sound a right answer makes', () => {
  test('it plays on a find, and climbs with the run', async () => {
    const notes: number[] = [];
    const user = userEvent.setup();
    renderApp(<App playChime={() => {}} playFound={(step) => notes.push(step)} />);

    const first = findSolvableTriple();
    await select(user, first.concepts);
    await user.type(screen.getByPlaceholderText(/type a category here/i), first.property);
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // The step given is where the player is in their run, so a run can be
    // heard climbing without looking at the board.
    expect(notes).toEqual([1]);
  });

  test('a wrong answer makes none', async () => {
    const notes: number[] = [];
    const user = userEvent.setup();
    renderApp(<App playChime={() => {}} playFound={(step) => notes.push(step)} />);

    const { concepts } = findSolvableTriple();
    await select(user, concepts);
    await user.type(screen.getByPlaceholderText(/type a category here/i), 'not a category');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/not quite/i);
    expect(notes).toEqual([]);
  });

  test('muted means muted, for this as well as for the unlocks', async () => {
    const notes: number[] = [];
    const user = userEvent.setup();
    renderApp(<App playChime={() => {}} playFound={(step) => notes.push(step)} />);

    await user.click(screen.getByRole('button', { name: /mute achievement sound/i }));

    const first = findSolvableTriple();
    await select(user, first.concepts);
    await user.type(screen.getByPlaceholderText(/type a category here/i), first.property);
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(notes).toEqual([]);
  });
})
