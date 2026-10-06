import { screen } from '@testing-library/react'
import { renderApp } from './test-utils'
import PropertySheet from './PropertySheet'
import type { PropertyRow } from './properties'

const rows: PropertyRow[] = [
  { property: 'metal', have: 3, total: 3, complete: true },
  { property: 'small', have: 3, total: 4, complete: false },
];

test('the categories found are on screen without being asked for', () => {
  // It used to be a menu that opened on a hover. A tester asked for it open,
  // and they were right: it is the record of their own work, and the one thing
  // on the board that answers "what have I already named?".
  renderApp(<PropertySheet rows={rows} />);

  const entries = screen.getAllByRole('listitem');
  expect(entries).toHaveLength(2);
  expect(entries[0]).toHaveTextContent(/metal/i);
  expect(entries[0]).toHaveAttribute('data-complete', 'true');
  expect(entries[1]).toHaveTextContent('3 / 4');
  expect(entries[1]).toHaveAttribute('data-complete', 'false');
});

test('it counts the finished ones against the rest', () => {
  renderApp(<PropertySheet rows={rows} />);

  expect(screen.getByTestId('properties-done')).toHaveTextContent('1 / 2');
});

test('nothing found yet means no panel at all, rather than an empty one', () => {
  // On arrival there is nothing to record, and an empty box in the corner of
  // the board is furniture.
  renderApp(<PropertySheet rows={[]} />);

  expect(screen.queryByRole('list')).toBeNull();
  expect(screen.queryByTestId('properties-done')).toBeNull();
});

test('nothing in it can be clicked, because nothing in it does anything', () => {
  renderApp(<PropertySheet rows={rows} />);

  expect(screen.queryByRole('button')).toBeNull();
});
