import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './test-utils'
import App from './App'
import { SKIP_KEY } from './greeting'
import { FOUND_DECAY, FOUND_GAIN, READY_DECAY, READY_GAIN } from './achievements/chime'

beforeEach(() => localStorage.setItem(SKIP_KEY, 'true'));
afterEach(() => localStorage.clear());

test('the third pick is answered more quietly than a right answer', () => {
  // One of these is a reward and the other is a door unlocking. Played as
  // often as the find note and louder than it, this would be the loudest
  // thing in the game and the first thing anybody muted.
  expect(READY_GAIN).toBeLessThan(FOUND_GAIN);
  expect(READY_DECAY).toBeLessThan(FOUND_DECAY);
});

test('picking a third concept says so', async () => {
  const user = userEvent.setup();
  const ticks: number[] = [];
  renderApp(<App playChime={() => {}} playFound={() => {}} playReady={() => ticks.push(1)} />);

  const bubbles = screen.getAllByRole('checkbox');
  await user.click(bubbles[0]);
  await user.click(bubbles[1]);
  expect(ticks).toEqual([]);

  await user.click(bubbles[2]);
  expect(ticks).toEqual([1]);
});

test('a fourth and a fifth say nothing, because nothing changed', async () => {
  // The sound is the box becoming usable, not a counter ticking over.
  const user = userEvent.setup();
  const ticks: number[] = [];
  renderApp(<App playChime={() => {}} playFound={() => {}} playReady={() => ticks.push(1)} />);

  const bubbles = screen.getAllByRole('checkbox');
  for (const bubble of bubbles.slice(0, 5)) await user.click(bubble);

  expect(ticks).toEqual([1]);
});

test('dropping back under three and climbing again says it again', async () => {
  const user = userEvent.setup();
  const ticks: number[] = [];
  renderApp(<App playChime={() => {}} playFound={() => {}} playReady={() => ticks.push(1)} />);

  const bubbles = screen.getAllByRole('checkbox');
  await user.click(bubbles[0]);
  await user.click(bubbles[1]);
  await user.click(bubbles[2]);
  await user.click(bubbles[2]);
  await user.click(bubbles[3]);

  expect(ticks).toEqual([1, 1]);
});

test('a muted game stays silent', async () => {
  const user = userEvent.setup();
  const ticks: number[] = [];
  localStorage.setItem('properties-game:muted', 'true');
  renderApp(<App playChime={() => {}} playFound={() => {}} playReady={() => ticks.push(1)} />);

  const bubbles = screen.getAllByRole('checkbox');
  for (const bubble of bubbles.slice(0, 3)) await user.click(bubble);

  expect(ticks).toEqual([]);
});
