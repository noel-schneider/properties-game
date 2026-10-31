import { getAllConcepts } from './concepts'
import { formableGroups } from './board'
import { SKIP_KEY } from './greeting'
import words from './i18n/en.json'
import {
    DECOYS, NEWCOMER, TRIO, TUTORIAL_KEY,
    answer, drop, markTutorialDone, needsTutorial, startTour, stepOf, toggle,
} from './tour'
import type { Wordings } from './guess'

const pool = getAllConcepts();
const concepts = pool.filter((c) => [...TRIO, ...DECOYS, NEWCOMER].includes(c.name as never));
const wordings: Wordings = Object.fromEntries(
  Object.entries(words.properties).map(([id, label]) => [
    id,
    { label, aliases: (words.aliases as Record<string, string[]>)[id] ?? [] },
  ]),
);

beforeEach(() => localStorage.clear());

function picked(...names: string[]) {
  return names.reduce(toggle, startTour());
}

test('every concept the tutorial uses is one the game knows', () => {
  expect(concepts).toHaveLength(TRIO.length + DECOYS.length + 1);
});

test('the board has exactly one right answer, so the lesson cannot go sideways', () => {
  // A second trio on the board would be a right answer the instruction does
  // not mention; the decoys are there to be passed over, not to be found.
  const groups = formableGroups(startTour().board, concepts, []);
  const trios = new Set(groups.map((g) => [...g.concepts].sort().join()));

  expect(trios).toEqual(new Set([[...TRIO].sort().join()]));
});

test('the steps follow the two gestures in order', () => {
  let tour = startTour();
  expect(stepOf(tour)).toBe('pick');

  tour = picked(...TRIO);
  expect(stepOf(tour)).toBe('name');

  tour = answer(tour, 'insect', { wordings, concepts }).tour;
  expect(stepOf(tour)).toBe('drag');
  expect(tour.board).toContain(NEWCOMER);
  expect(tour.arriving).toEqual([NEWCOMER]);

  tour = drop(tour, 0, NEWCOMER, concepts).tour;
  expect(stepOf(tour)).toBe('done');
});

test('any category the three really share is accepted, not only the example', () => {
  const { correct, tour } = answer(picked(...TRIO), 'animal', { wordings, concepts });

  expect(correct).toBe(true);
  // And the newcomer still fits whichever one was named.
  expect(drop(tour, 0, NEWCOMER, concepts).correct).toBe(true);
});

test('a wrong answer is refused like in the game, and the step stays', () => {
  const { correct, tour } = answer(picked(TRIO[0], TRIO[1], DECOYS[0]), 'insect', { wordings, concepts });

  expect(correct).toBe(false);
  expect(tour.feedback).toBe('wrong');
  expect(stepOf(tour)).toBe('name');
});

test('only the newcomer can be dropped into the group', () => {
  const named = answer(picked(...TRIO), 'insect', { wordings, concepts }).tour;

  // A member of the group has already spent the category; a decoy never had it.
  expect(drop(named, 0, TRIO[0], concepts).correct).toBe(false);
  expect(drop(named, 0, DECOYS[0], concepts).correct).toBe(false);
});

test('nothing more is picked once the group is found', () => {
  const named = answer(picked(...TRIO), 'insect', { wordings, concepts }).tour;

  expect(toggle(named, DECOYS[0]).selected).toEqual([]);
});

describe('who is walked through it', () => {
  test('somebody arriving for the first time', () => {
    expect(needsTutorial(0)).toBe(true);
  });

  test('not somebody who has done it or skipped it', () => {
    markTutorialDone();
    expect(needsTutorial(0)).toBe(false);
    expect(localStorage.getItem(TUTORIAL_KEY)).toBe('true');
  });

  test('not somebody with a game already under way', () => {
    expect(needsTutorial(2)).toBe(false);
  });

  test('not the end-to-end suite, which skips every arrival card', () => {
    localStorage.setItem(SKIP_KEY, 'true');
    expect(needsTutorial(0)).toBe(false);
  });
});
