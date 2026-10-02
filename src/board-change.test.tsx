import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { renderApp } from './test-utils'
import { getAllConcepts } from './concepts'
import { sharedProperties } from './guess'
import type { Concept } from './types'

afterEach(() => localStorage.clear());

const byName = new Map(getAllConcepts().map((c) => [c.name, c]));

function board(): Concept[] {
  return screen.getAllByRole('checkbox').map((b) => byName.get(b.getAttribute('aria-label')!)!);
}

/** The groups the debug panel says are still to be found. */
function remaining(): string[] {
  return [...document.querySelectorAll('[data-testid^=answer-][data-found=false]')].map(
    (li) => li.getAttribute('data-testid')!.replace('answer-', ''),
  );
}

async function solve(user: ReturnType<typeof userEvent.setup>, property: string) {
  const members = board().filter((c) => c.properties.includes(property)).slice(0, 3);
  expect(members).toHaveLength(3);
  expect(sharedProperties(members)).toContain(property);

  for (const concept of members) {
    await user.click(screen.getByRole('checkbox', { name: concept.name }));
  }
  await user.type(screen.getByPlaceholderText(/type a category here/i), property);
  await user.click(screen.getByRole('button', { name: /submit/i }));
  await screen.findByRole('status');
}

test('clearing a board counts every category found on it', async () => {
  const user = userEvent.setup();
  renderApp(<App playChime={() => {}} />);

  const groups = remaining();
  expect(groups).toHaveLength(3);

  for (const property of groups) {
    await solve(user, property);
  }

  expect(screen.getByTestId('categories')).toHaveTextContent(`${groups.length} / 51`);
});

test('a new board starts with nothing found on it', async () => {
  const user = userEvent.setup();
  renderApp(<App playChime={() => {}} />);

  for (const property of remaining()) {
    await solve(user, property);
  }

  // The board has been replaced; none of its groups can already be found.
  expect(document.querySelectorAll('[data-testid^=answer-][data-found=true]')).toHaveLength(0);
  expect(screen.getAllByRole('checkbox')).toHaveLength(15);
});

test('the tally rises by one for each new category, including the last of a board', async () => {
  const user = userEvent.setup();
  renderApp(<App playChime={() => {}} />);

  const groups = remaining();
  const counted: string[] = [];

  for (const property of groups) {
    const before = screen.getByTestId('categories').textContent;
    await solve(user, property);
    const after = screen.getByTestId('categories').textContent;
    counted.push(`${property}: ${before} -> ${after}`);
  }

  expect(counted.join('\n')).toBe(
    groups.map((p, i) => `${p}: ${i} / 51 -> ${i + 1} / 51`).join('\n'),
  );
});
