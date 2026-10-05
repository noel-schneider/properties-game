import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './test-utils'
import Help, { LESSONS } from './Help'
import { saveGreeted } from './greeting'

afterEach(() => localStorage.clear());

test('somebody arriving for the first time is shown how to play', () => {
  renderApp(<Help />);

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getAllByRole('listitem')).toHaveLength(LESSONS.length);
});

test('the welcome stays put while the pointer wanders', () => {
  // The panel normally follows the pointer and shuts the moment it leaves.
  // A greeting that vanishes before it is read is no greeting.
  renderApp(<Help />);

  fireEvent.pointerLeave(screen.getByRole('button', { name: /how to play/i }).parentElement!);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('it goes when it is dismissed, and does not come back', async () => {
  const user = userEvent.setup();
  const { unmount } = renderApp(<Help />);

  await user.click(screen.getByRole('button', { name: /got it|c.est parti/i }));
  expect(screen.queryByRole('dialog')).toBeNull();
  unmount();

  renderApp(<Help />);
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('a player who has been here before is left alone', () => {
  saveGreeted();
  renderApp(<Help />);

  expect(screen.queryByRole('dialog')).toBeNull();
});

test('the welcome does not count the lessons for itself', () => {
  // It said "four things" while the panel held five: the ring joined them and
  // the sentence kept counting.
  renderApp(<Help />);

  // The opening line only — "pick three concepts" is a lesson, and counts
  // the concepts in a group rather than the lessons in the panel.
  expect(document.querySelector('.greeting__welcome')!.textContent)
      .not.toMatch(/\b(three|four|five|six)\b/i);
});

test('the greeting takes the middle of the screen, not the corner', () => {
  // A panel hanging off the question mark reads as a tooltip somebody opened
  // by accident. The rules are the only thing to read at that moment.
  renderApp(<Help />);

  const card = document.querySelector('.greeting__card')!;
  expect(card).not.toBeNull();
  expect(card.closest('.help')).toBeNull();
  expect(document.querySelector('.help__sheet')).toBeNull();
});

test('the question mark still answers for the rest of the game', () => {
  saveGreeted();
  renderApp(<Help />);

  // Pointed at rather than clicked: a click arrives after the pointer has
  // entered, which opens the panel and then shuts it again.
  fireEvent.pointerEnter(screen.getByRole('button', { name: /how to play/i }).parentElement!);
  expect(document.querySelector('.help__sheet')).not.toBeNull();
  expect(document.querySelector('.greeting__card')).toBeNull();
});
