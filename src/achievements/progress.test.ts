import { advance, emptyProgress } from './progress'
import type { GameEvent, Progress } from './types'

const deal: GameEvent = { type: 'board-dealt', at: 1_000, groups: 3 };

function win(over: Partial<Extract<GameEvent, { type: 'guess' }>> = {}): GameEvent {
  return { type: 'guess', at: 2_000, correct: true, property: 'biome', exactName: true, selection: ['a', 'b', 'c'], ...over };
}

function miss(over: Partial<Extract<GameEvent, { type: 'guess' }>> = {}): GameEvent {
  return { type: 'guess', at: 2_000, correct: false, exactName: false, selection: ['a', 'b', 'c'], ...over };
}

function play(events: GameEvent[], from: Progress = emptyProgress()): Progress {
  return events.reduce(advance, from);
}

test('a correct guess raises the session and lifetime counters', () => {
  const p = play([deal, win()]);

  expect(p.session.finds).toBe(1);
  expect(p.session.streak).toBe(1);
  expect(p.session.boardFinds).toBe(1);
  expect(p.lifetime.exactAnswers).toBe(1);
  expect(p.lifetime.propertiesFound).toEqual(['biome']);
});

test('an answer in the player own words counts as an alias, not an exact term', () => {
  const p = play([deal, win({ exactName: false })]);

  expect(p.lifetime.aliasAnswers).toBe(1);
  expect(p.lifetime.exactAnswers).toBe(0);
});

test('the same category found twice is only collected once', () => {
  const p = play([deal, win(), win()]);

  expect(p.lifetime.propertiesFound).toEqual(['biome']);
});

test('a wrong guess breaks the streak and marks the board', () => {
  const p = play([deal, win(), miss()]);

  expect(p.session.streak).toBe(0);
  expect(p.session.boardMistakes).toBe(1);
});

test('a new board resets the board counters but not the session', () => {
  const p = play([deal, win(), miss(), { type: 'board-dealt', at: 5_000, groups: 3 }]);

  expect(p.session.boardMistakes).toBe(0);
  expect(p.session.boardFinds).toBe(0);
  expect(p.session.boardDealtAt).toBe(5_000);
  expect(p.session.finds).toBe(1);
});

test('toggles are counted per concept and cleared once an answer is given', () => {
  const toggles: GameEvent[] = Array(3).fill({ type: 'concept-toggled', name: 'snow' });

  expect(play([deal, ...toggles]).session.toggleCounts.snow).toBe(3);
  expect(play([deal, ...toggles, miss()]).session.toggleCounts).toEqual({});
});

test('concepts that run out of properties are counted for good', () => {
  const p = play([deal, { type: 'concept-finished', at: 1 }, { type: 'concept-finished', at: 2 }]);

  expect(p.lifetime.conceptsFinished).toBe(2);
});

test('answering right on the selection just refused is flagged, and only then', () => {
  const redeemed = play([deal, miss({ selection: ['a', 'b'] }), win({ selection: ['a', 'b'] })]);
  const unrelated = play([deal, miss({ selection: ['a', 'b'] }), win({ selection: ['x', 'y'] })]);

  expect(redeemed.session.redeemedLastMiss).toBe(true);
  expect(unrelated.session.redeemedLastMiss).toBe(false);
});

test('a guess before any board was dealt leaves the board clock unset', () => {
  const p = play([win()]);

  expect(p.session.boardDealtAt).toBeNull();
});
