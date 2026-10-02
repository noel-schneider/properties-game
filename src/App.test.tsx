import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { getAllConcepts } from './concepts';
import { sharedProperties } from './guess';
import type { Concept } from './types';

const byName = new Map(getAllConcepts().map((c) => [c.name, c]));

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
