import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { renderApp } from './test-utils'
import { allProperties, getAllConcepts } from './concepts'

/** Taken from the data, so adding categories does not break these.*/
const TOTAL = allProperties().length;
import { sharedProperties } from './guess'

afterEach(() => localStorage.clear());

const byName = new Map(getAllConcepts().map((c) => [c.name, c]));

interface Group { property: string; concepts: string[] }

/**
 * The groups the debug panel says are still to be found, with the very
 * concepts it names. Picking any three that share the category would be
 * playing differently: it can lock a concept another group still needs.
 */
function remaining(): Group[] {
  return [...document.querySelectorAll('[data-testid^=answer-][data-found=false]')].map((li) => ({
    property: li.getAttribute('data-testid')!.replace('answer-', ''),
    concepts: li.querySelectorAll('span')[1].textContent!.split(' · '),
  }));
}

async function solve(user: ReturnType<typeof userEvent.setup>, group: Group) {
  const members = group.concepts.map((name) => byName.get(name)!);
  expect(members).toHaveLength(3);
  expect(sharedProperties(members)).toContain(group.property);

  for (const concept of members) {
    await user.click(screen.getByRole('checkbox', { name: concept.name }));
  }
  await user.type(screen.getByPlaceholderText(/type a category here/i), group.property);
  await user.click(screen.getByRole('button', { name: /submit/i }));
  await screen.findByRole('status');
}

test('clearing a board counts every category found on it', async () => {
  const user = userEvent.setup();
  renderApp(<App playChime={() => {}} />);

  const groups = remaining();
  expect(groups).toHaveLength(3);

  for (const group of groups) {
    await solve(user, group);
  }

  expect(screen.getByTestId('categories')).toHaveTextContent(`${groups.length} / ${TOTAL}`);
});

test('a new board starts with nothing found on it', async () => {
  const user = userEvent.setup();
  renderApp(<App playChime={() => {}} />);

  for (const group of remaining()) {
    await solve(user, group);
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

  for (const group of groups) {
    const before = screen.getByTestId('categories').textContent;
    await solve(user, group);
    const after = screen.getByTestId('categories').textContent;
    counted.push(`${group.property}: ${before} -> ${after}`);
  }

  expect(counted.join('\n')).toBe(
    groups.map((g, i) => `${g.property}: ${i} / ${TOTAL} -> ${i + 1} / ${TOTAL}`).join('\n'),
  );
});
