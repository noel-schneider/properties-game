import { render, screen } from '@testing-library/react';
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

test('the dealt hand always contains a solvable triple', () => {
  render(<App />);

  expect(() => findSolvableTriple()).not.toThrow();
});

test('naming the category the selected concepts share is accepted', async () => {
  const user = userEvent.setup();
  render(<App />);

  const { concepts, property } = findSolvableTriple();
  await select(user, concepts);
  await user.type(screen.getByPlaceholderText(/type a category here/i), property);
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/correct/i);
});

test('naming a category the selected concepts do not share is rejected', async () => {
  const user = userEvent.setup();
  render(<App />);

  const { concepts } = findSolvableTriple();
  await select(user, concepts);
  await user.type(
    screen.getByPlaceholderText(/type a category here/i),
    'definitely not a real category',
  );
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/not quite/i);
});

test('a correct answer retires the found concepts and scores a point', async () => {
  const user = userEvent.setup();
  render(<App />);

  const { concepts, property } = findSolvableTriple();
  await select(user, concepts);
  await user.type(screen.getByPlaceholderText(/type a category here/i), property);
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/correct/i);
  expect(screen.getByTestId('score')).toHaveTextContent('1');

  const stillDealt = screen.getAllByRole('checkbox').map((b) => b.getAttribute('aria-label'));
  for (const concept of concepts) {
    expect(stillDealt).not.toContain(concept.name);
  }
  expect(stillDealt).toHaveLength(15);
});

test('a wrong answer leaves the board and the score alone', async () => {
  const user = userEvent.setup();
  render(<App />);

  const before = screen.getAllByRole('checkbox').map((b) => b.getAttribute('aria-label'));
  const { concepts } = findSolvableTriple();
  await select(user, concepts);
  await user.type(screen.getByPlaceholderText(/type a category here/i), 'not a category');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/not quite/i);
  expect(screen.getByTestId('score')).toHaveTextContent('0');
  expect(screen.getAllByRole('checkbox').map((b) => b.getAttribute('aria-label'))).toEqual(before);
});

test('a correct answer clears the selection and the input', async () => {
  const user = userEvent.setup();
  render(<App />);

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
  render(<App />);

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
  render(<App playChime={chime} />);

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
  render(<App playChime={chime} />);

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
  const { unmount } = render(<App playChime={() => {}} />);

  const first = findSolvableTriple();
  await select(user, first.concepts);
  await user.type(screen.getByPlaceholderText(/type a category here/i), first.property);
  await user.click(screen.getByRole('button', { name: /submit/i }));
  expect((await screen.findAllByRole('alert')).map((a) => a.textContent).join(' ')).toContain('First Light');
  unmount();

  render(<App playChime={() => {}} />);
  const again = findSolvableTriple();
  await select(user, again.concepts);
  await user.type(screen.getByPlaceholderText(/type a category here/i), again.property);
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/correct/i);
  expect(screen.queryByRole('alert')).toBeNull();
});

test('the achievements button counts what has been earned', async () => {
  const user = userEvent.setup();
  render(<App playChime={() => {}} />);

  const button = screen.getByRole('button', { name: /achievements/i });
  expect(button).toHaveTextContent('0 / 14');

  const { concepts, property } = findSolvableTriple();
  await select(user, concepts);
  await user.type(screen.getByPlaceholderText(/type a category here/i), property);
  await user.click(screen.getByRole('button', { name: /submit/i }));

  await screen.findAllByRole('alert');
  expect(button).not.toHaveTextContent('0 / 14');
});

test('muting the sound silences the next unlock, and is remembered', async () => {
  const chime = vi.fn();
  const user = userEvent.setup();
  const { unmount } = render(<App playChime={chime} />);

  await user.click(screen.getByRole('button', { name: /mute achievement sound/i }));

  const { concepts, property } = findSolvableTriple();
  await select(user, concepts);
  await user.type(screen.getByPlaceholderText(/type a category here/i), property);
  await user.click(screen.getByRole('button', { name: /submit/i }));

  await screen.findAllByRole('alert');
  expect(chime).not.toHaveBeenCalled();

  unmount();
  render(<App playChime={() => {}} />);
  expect(screen.getByRole('button', { name: /unmute achievement sound/i })).toBeInTheDocument();
});
