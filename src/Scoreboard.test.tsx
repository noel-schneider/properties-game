import { screen } from '@testing-library/react'
import { renderApp } from './test-utils'
import Scoreboard from './Scoreboard'

test('it reads out what has been found, what is done, and what is left here', () => {
  renderApp(<Scoreboard finds={7} finished={12} total={100} remaining={3}  />);

  expect(screen.getByTestId('found')).toHaveTextContent('7');
  expect(screen.getByTestId('finished')).toHaveTextContent('12 / 100');
  expect(screen.getByTestId('remaining')).toHaveTextContent('3');
});

test('what is finished is counted against the whole game, not against the board', () => {
  // The board grows as it is played — measured jumping by twenty concepts at
  // once with nothing finished — so a fraction of the board made the player
  // look like they were going backwards for doing nothing wrong.
  const { rerender } = renderApp(<Scoreboard finds={7} finished={12} total={100} remaining={3}  />);
  const before = screen.getByTestId('finished').textContent;

  rerender(<Scoreboard finds={7} finished={12} total={100} remaining={5}  />);

  expect(screen.getByTestId('finished')).toHaveTextContent(before!);
});

// The categories named so far are counted in their own column now, and what
// that column says is pinned in PropertySheet.test.tsx.
