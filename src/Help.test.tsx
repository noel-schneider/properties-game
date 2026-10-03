import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './test-utils'
import Help, { LESSONS } from './Help'

test('it is one button until it is asked for', () => {
  renderApp(<Help />);

  expect(screen.getByRole('button', { name: /how to play/i })).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('pointing at it opens it', () => {
  renderApp(<Help />);
  fireEvent.pointerEnter(screen.getByRole('button', { name: /how to play/i }));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('tapping it opens it too, since a finger never points', () => {
  // The reveal on the board had exactly this hole: hover-only meant a phone
  // could not reach it at all.
  renderApp(<Help />);
  fireEvent.click(screen.getByRole('button', { name: /how to play/i }));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('it closes when the pointer leaves, and when escape is pressed', async () => {
  const user = userEvent.setup();
  renderApp(<Help />);
  const button = screen.getByRole('button', { name: /how to play/i });

  fireEvent.pointerEnter(button);
  fireEvent.pointerLeave(button.parentElement!);
  expect(screen.queryByRole('dialog')).toBeNull();

  fireEvent.click(button);
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('every lesson is drawn as well as written', () => {
  // A picture is the point: the gestures are hard to put into one line of
  // text and easy to show.
  renderApp(<Help />);
  fireEvent.click(screen.getByRole('button', { name: /how to play/i }));

  const entries = screen.getAllByRole('listitem');
  expect(entries).toHaveLength(LESSONS.length);
  for (const entry of entries) {
    expect(entry.querySelector('svg')).not.toBeNull();
    expect(entry.textContent?.trim().length).toBeGreaterThan(0);
  }
});

test('the ring around a concept is explained, since nothing else explains it', () => {
  // It is the one mark on the board with no words anywhere near it: a player
  // who never reads this has no way of learning what it counts.
  renderApp(<Help />);
  fireEvent.click(screen.getByRole('button', { name: /how to play/i }));

  expect(screen.getByRole('dialog')).toHaveTextContent(/fills|ring/i);
});
