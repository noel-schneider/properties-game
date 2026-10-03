import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../test-utils'
import Panel from './Panel'
import { CATALOGUE } from './catalogue'

async function openPanel(onForget = () => {}, unlocked = ['first-light', 'collector']) {
  const user = userEvent.setup();
  renderApp(<Panel unlocked={unlocked} onForget={onForget} />);
  await user.click(screen.getByRole('button', { name: /achievements/i }));
  return user;
}

test('the panel offers to clear what has been earned', async () => {
  await openPanel();

  expect(screen.getByRole('button', { name: /clear the achievements/i })).toBeInTheDocument();
});

test('it asks first, because there is no getting them back', async () => {
  const cleared: true[] = [];
  const user = await openPanel(() => cleared.push(true));

  await user.click(screen.getByRole('button', { name: /clear the achievements/i }));
  expect(cleared).toEqual([]);

  await user.click(screen.getByRole('button', { name: /yes, clear them/i }));
  expect(cleared).toEqual([true]);
});

test('changing your mind leaves them alone', async () => {
  const cleared: true[] = [];
  const user = await openPanel(() => cleared.push(true));

  await user.click(screen.getByRole('button', { name: /clear the achievements/i }));
  await user.click(screen.getByRole('button', { name: /keep them/i }));

  expect(cleared).toEqual([]);
  expect(screen.queryByRole('button', { name: /yes, clear them/i })).toBeNull();
});

test('with none earned there is nothing to clear', async () => {
  // A button that can only ever do nothing is a button that teaches the player
  // their clicks do not matter.
  await openPanel(() => {}, []);

  expect(screen.getByRole('button', { name: /clear the achievements/i })).toBeDisabled();
  expect(CATALOGUE.length).toBeGreaterThan(0);
});
