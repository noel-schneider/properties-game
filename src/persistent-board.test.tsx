import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { renderApp } from './test-utils'

afterEach(() => localStorage.clear());

/** The groups the debug panel says can be formed right now. */
function formable(): Array<{ property: string; concepts: string[] }> {
  return [...document.querySelectorAll('[data-testid^=answer-]')].map((li) => ({
    property: li.getAttribute('data-testid')!.replace('answer-', ''),
    concepts: li.querySelectorAll('span')[1].textContent!.split(' · '),
  }));
}

async function solve(user: ReturnType<typeof userEvent.setup>, group: { property: string; concepts: string[] }) {
  for (const name of group.concepts) {
    await user.click(screen.getByRole('checkbox', { name }));
  }
  await user.type(screen.getByPlaceholderText(/type a category here/i), group.property);
  await user.click(screen.getByRole('button', { name: /submit/i }));
  await screen.findByRole('status');
}

test('the concepts stay on the board rather than being swept away', async () => {
  const user = userEvent.setup();
  renderApp(<App playChime={() => {}} />);

  const group = formable()[0];
  await solve(user, group);

  for (const name of group.concepts) {
    expect(screen.getByLabelText(name)).toBeInTheDocument();
  }
});

test('a concept used once is still selectable, with its other properties open', async () => {
  const user = userEvent.setup();
  renderApp(<App playChime={() => {}} />);

  const first = formable()[0];
  await solve(user, first);

  // Still a checkbox, and the panel still counts it as having work left.
  for (const name of first.concepts) {
    const bubble = screen.getByLabelText(name);
    const [done, total] = bubble.getAttribute('data-progress')!.split('/').map(Number);

    expect(done).toBe(1);
    if (total > 1) {
      expect(bubble).toHaveAttribute('role', 'checkbox');
      expect(bubble).toHaveAttribute('data-found', 'false');
    }
  }
});

test('naming a category one of the three has already spent is refused', async () => {
  const user = userEvent.setup();
  renderApp(<App playChime={() => {}} />);

  const group = formable()[0];
  await solve(user, group);

  // The very same three, the very same category: nothing left to advance.
  for (const name of group.concepts) {
    await user.click(screen.getByRole('checkbox', { name }));
  }
  await user.type(screen.getByPlaceholderText(/type a category here/i), group.property);
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/not quite/i);
});

test('there is always something left to find on the board', async () => {
  const user = userEvent.setup();
  renderApp(<App playChime={() => {}} />);

  for (let turn = 0; turn < 12; turn++) {
    const groups = formable();
    expect(groups.length, `nothing to find after ${turn} groups`).toBeGreaterThan(0);
    await solve(user, groups[0]);
  }
});

test('what has been found survives a reload', async () => {
  const user = userEvent.setup();
  const { unmount } = renderApp(<App playChime={() => {}} />);

  await solve(user, formable()[0]);
  expect(screen.getByTestId('found')).toHaveTextContent('1');
  unmount();

  renderApp(<App playChime={() => {}} />);
  expect(screen.getByTestId('found')).toHaveTextContent('1');
});
