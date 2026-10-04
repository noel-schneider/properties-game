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
  expect(document.querySelector('.help__welcome')!.textContent)
      .not.toMatch(/\b(three|four|five|six)\b/i);
});
