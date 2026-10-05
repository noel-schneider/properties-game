import { ASK_AFTER, SUPPORT_URL, worthAsking } from './supporting'

test('nothing is asked of someone who has just arrived', () => {
  expect(worthAsking({ finds: 1, asked: false })).toBe(false);
  expect(worthAsking({ finds: ASK_AFTER - 1, asked: false })).toBe(false);
});

test('it is asked once a player has clearly stayed', () => {
  expect(worthAsking({ finds: ASK_AFTER, asked: false })).toBe(true);
});

test('and never again once it has been', () => {
  // Measured: a whole game is 114 answers. Asking on a count rather than once
  // would mean asking again every thirty answers for the rest of it.
  expect(worthAsking({ finds: ASK_AFTER, asked: true })).toBe(false);
  expect(worthAsking({ finds: 500, asked: true })).toBe(false);
});

test('it arrives a third of the way in, not at the door and not at the end', () => {
  // A whole game is about 114 answers. Five achievements land by the tenth,
  // which is too early to have earned anything; ten land by the hundred and
  // first, which is the end screen's moment, not a separate one.
  expect(ASK_AFTER).toBeGreaterThan(10);
  expect(ASK_AFTER).toBeLessThan(50);
});

test('the link is a real one, and leaves the player somewhere they chose to go', () => {
  expect(SUPPORT_URL).toMatch(/^https:\/\//);
});
