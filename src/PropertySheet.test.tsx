import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './test-utils'
import PropertySheet from './PropertySheet'
import type { PropertyRow } from './properties'

const rows: PropertyRow[] = [
  { property: 'metal', have: 3, total: 3, complete: true },
  { property: 'small', have: 3, total: 4, complete: false },
];

test('it counts the finished ones, and stays shut until it is asked', () => {
  renderApp(<PropertySheet rows={rows} />);

  expect(screen.getByTestId('properties-done')).toHaveTextContent('1 / 2');
  expect(screen.queryByRole('list')).toBeNull();
});

test('opening it shows what is done and what is still short', async () => {
  const user = userEvent.setup();
  renderApp(<PropertySheet rows={rows} />);

  await user.click(screen.getByRole('button'));

  const entries = screen.getAllByRole('listitem');
  expect(entries).toHaveLength(2);
  expect(entries[0]).toHaveTextContent(/metal/i);
  expect(entries[0]).toHaveAttribute('data-complete', 'true');
  expect(entries[1]).toHaveTextContent('3 / 4');
  expect(entries[1]).toHaveAttribute('data-complete', 'false');
});

test('it closes when the pointer goes elsewhere, and on escape', async () => {
  // It opens on a hover now, so a click cannot be what shuts it: the pointer
  // is still on the button at that moment and would reopen it at once.
  const user = userEvent.setup();
  renderApp(<PropertySheet rows={rows} />);

  await user.click(screen.getByRole('button'));
  expect(screen.getByRole('list')).toBeInTheDocument();

  await user.keyboard('{Escape}');
  expect(screen.queryByRole('list')).toBeNull();
});

test('a hover is enough to open it', () => {
  renderApp(<PropertySheet rows={rows} />);

  fireEvent.pointerEnter(screen.getByRole('button').parentElement!);
  expect(screen.getByRole('list')).toBeInTheDocument();
});

test('nothing found yet means nothing to open', () => {
  renderApp(<PropertySheet rows={[]} />);

  expect(screen.getByTestId('properties-done')).toHaveTextContent('0 / 0');
  expect(screen.getByRole('button')).toBeDisabled();
});
