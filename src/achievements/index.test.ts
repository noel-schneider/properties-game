import { recordEvent } from './index'
import { emptyProgress } from './progress'
import type { GameEvent, Progress } from './types'

const AT = new Date('2026-10-02T15:00:00').getTime();
const NIGHT = new Date('2026-10-02T03:00:00').getTime();

function deal(groups = 3, at = AT): GameEvent {
  return { type: 'board-dealt', at, groups };
}

function win(over: Partial<Extract<GameEvent, { type: 'guess' }>> = {}): GameEvent {
  return { type: 'guess', at: AT + 60_000, correct: true, property: 'biome', exactName: true, selection: ['a', 'b', 'c'], ...over };
}

function miss(over: Partial<Extract<GameEvent, { type: 'guess' }>> = {}): GameEvent {
  return { type: 'guess', at: AT + 60_000, correct: false, exactName: false, selection: ['a', 'b', 'c'], ...over };
}

/** Plays the events through and returns everything unlocked along the way. */
function unlockedBy(events: GameEvent[]): string[] {
  let progress: Progress = emptyProgress();
  const seen: string[] = [];
  for (const event of events) {
    const result = recordEvent(progress, event);
    progress = result.progress;
    seen.push(...result.unlocked.map((a) => a.id));
  }
  return seen;
}

const toggles = (name: string, times: number): GameEvent[] =>
  Array.from({ length: times }, () => ({ type: 'concept-toggled', name }) as GameEvent);

const wins = (count: number, over: Partial<Extract<GameEvent, { type: 'guess' }>> = {}): GameEvent[] =>
  Array.from({ length: count }, (_, i) => win({ property: `p${i}`, ...over }));

test('first-light on the first category found', () => {
  expect(unlockedBy([deal(), win()])).toContain('first-light');
});

test('hat-trick on a board cleared without a miss', () => {
  expect(unlockedBy([deal(2), win(), win({ property: 'cold' })])).toContain('hat-trick');
});

test('hat-trick not awarded when the board cost a mistake', () => {
  expect(unlockedBy([deal(2), miss(), win(), win({ property: 'cold' })])).not.toContain('hat-trick');
});

test('in-your-words after ten answers in the player own wording', () => {
  expect(unlockedBy([deal(99), ...wins(10, { exactName: false })])).toContain('in-your-words');
});

test('streak-of-five after five in a row', () => {
  expect(unlockedBy([deal(99), ...wins(5)])).toContain('streak-of-five');
});

test('streak-of-five not awarded when a miss breaks the run', () => {
  expect(unlockedBy([deal(99), ...wins(4), miss(), ...wins(1)])).not.toContain('streak-of-five');
});

test('collector after twenty different categories', () => {
  expect(unlockedBy([deal(99), ...wins(20)])).toContain('collector');
});

test('quickdraw within ten seconds of the board', () => {
  expect(unlockedBy([deal(3), win({ at: AT + 9_000 })])).toContain('quickdraw');
  expect(unlockedBy([deal(3), win({ at: AT + 11_000 })])).not.toContain('quickdraw');
});

test('quickdraw is not awarded when no board was ever dealt', () => {
  expect(unlockedBy([win({ at: 5 })])).not.toContain('quickdraw');
});

test('marathon after twenty-five in one sitting', () => {
  expect(unlockedBy([deal(99), ...wins(25)])).toContain('marathon');
});

test('spotless after three spotless boards running', () => {
  const board = [deal(1, AT), win()];
  expect(unlockedBy([...board, ...board, ...board])).toContain('spotless');
});

test('second-guessing after ten toggles of one concept', () => {
  expect(unlockedBy([deal(), ...toggles('snow', 10)])).toContain('second-guessing');
});

test('second-guessing not awarded for toggles spread over several concepts', () => {
  expect(unlockedBy([deal(), ...toggles('snow', 5), ...toggles('igloo', 5)])).not.toContain('second-guessing');
});

test('scattershot after five misses on one board', () => {
  expect(unlockedBy([deal(), miss(), miss(), miss(), miss(), miss()])).toContain('scattershot');
});

test('big-net when eight or more concepts are selected', () => {
  const selection = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  expect(unlockedBy([deal(), win({ selection })])).toContain('big-net');
});

test('word-for-word after ten exact answers and no paraphrase', () => {
  expect(unlockedBy([deal(99), ...wins(10)])).toContain('word-for-word');
});

test('word-for-word is lost to a single paraphrase', () => {
  expect(unlockedBy([deal(99), win({ exactName: false }), ...wins(10)])).not.toContain('word-for-word');
});

test('and-yet when the refused selection is redeemed', () => {
  const selection = ['a', 'b', 'c'];
  expect(unlockedBy([deal(), miss({ selection }), win({ selection })])).toContain('and-yet');
});

test('and-yet not awarded for a win on a different selection', () => {
  expect(unlockedBy([deal(), miss({ selection: ['a', 'b'] }), win({ selection: ['x', 'y'] })])).not.toContain('and-yet');
});

test('night-owl between two and four in the morning', () => {
  expect(unlockedBy([deal(3, NIGHT)])).toContain('night-owl');
  expect(unlockedBy([deal(3, AT)])).not.toContain('night-owl');
});

test('an achievement already earned is not announced again', () => {
  const seen = unlockedBy([deal(99), win(), win({ property: 'cold' }), win({ property: 'food' })]);

  expect(seen.filter((id) => id === 'first-light')).toHaveLength(1);
});

test('two achievements earned on the same guess are both announced', () => {
  const selection = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const seen = recordEvent(
    recordEvent(emptyProgress(), deal(1)).progress,
    win({ selection, at: AT + 1_000 }),
  ).unlocked.map((a) => a.id);

  expect(seen).toEqual(expect.arrayContaining(['first-light', 'big-net', 'quickdraw', 'hat-trick']));
});

test('completionist when every category has been found', () => {
  const everything = Array.from({ length: 51 }, (_, i) => `p${i}`);
  const almost = everything.slice(0, 50);

  expect(unlockedBy([deal(99), ...wins(50)])).not.toContain('completionist');
  expect(unlockedBy([deal(99), ...almost.map((p) => win({ property: p })), win({ property: 'p50' })]))
    .toContain('completionist');
  expect(everything).toHaveLength(51);
});

test('unlocked ids are remembered in the lifetime record', () => {
  const result = recordEvent(recordEvent(emptyProgress(), deal()).progress, win());

  expect(result.progress.lifetime.unlocked).toContain('first-light');
});
