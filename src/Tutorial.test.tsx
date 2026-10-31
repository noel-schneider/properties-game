import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './test-utils'
import App from './App'
import { NEWCOMER, TUTORIAL_KEY } from './tour'

function firstVisit() {
  localStorage.clear();
  return renderApp(<App playChime={() => {}} playFound={() => {}} playReady={() => {}} />);
}

const tutorial = () => screen.queryByRole('region', { name: /tutorial/i });

afterEach(() => localStorage.clear());

test('a first visit opens on the tutorial, not on the rules card', () => {
  firstVisit();

  expect(tutorial()).toBeInTheDocument();
  expect(screen.getByText(/find three concepts/i)).toBeInTheDocument();
  // The card would list what the tutorial is about to have them do.
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  // Nothing of the game's own count is shown: none of this is the game yet.
  expect(screen.queryByTestId('found')).not.toBeInTheDocument();
});

test('it can be skipped, and is not offered again', async () => {
  const user = userEvent.setup();
  firstVisit();

  await user.click(screen.getByRole('button', { name: /skip the tutorial/i }));

  expect(tutorial()).not.toBeInTheDocument();
  expect(screen.getByTestId('found')).toHaveTextContent('0');
  expect(localStorage.getItem(TUTORIAL_KEY)).toBe('true');
});

test('the first lesson is played for real: three picked, then named', async () => {
  const user = userEvent.setup();
  firstVisit();

  for (const name of ['bee', 'ant', 'ladybug']) {
    await user.click(screen.getByRole('checkbox', { name }));
  }
  expect(screen.getByText(/now type what they have in common/i)).toBeInTheDocument();

  await user.type(screen.getByRole('textbox'), 'insect');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // On to the drag: a new concept on the board, and no box to type in.
  expect(screen.getByText(/drag it onto the group/i)).toBeInTheDocument();
  expect(screen.getByText(/step 2 of 2/i)).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: NEWCOMER })).toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});

test('a wrong name is refused, and the lesson waits', async () => {
  const user = userEvent.setup();
  firstVisit();

  for (const name of ['bee', 'ant', 'ladybug']) {
    await user.click(screen.getByRole('checkbox', { name }));
  }
  await user.type(screen.getByRole('textbox'), 'furniture');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByRole('status')).toHaveTextContent(/not a category/i);
  expect(screen.getByText(/step 1 of 2/i)).toBeInTheDocument();
});

test('nothing the tutorial finds is kept for the game', async () => {
  const user = userEvent.setup();
  firstVisit();

  for (const name of ['bee', 'ant', 'ladybug']) {
    await user.click(screen.getByRole('checkbox', { name }));
  }
  await user.type(screen.getByRole('textbox'), 'insect');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  await user.click(screen.getByRole('button', { name: /skip the tutorial/i }));

  expect(screen.getByTestId('found')).toHaveTextContent('0');
});

test('a returning player goes straight to the game, rules card and all', () => {
  localStorage.setItem(TUTORIAL_KEY, 'true');
  renderApp(<App playChime={() => {}} />);

  expect(tutorial()).not.toBeInTheDocument();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
