import { formableGroups, topUp } from './board'
import { getAllConcepts } from './concepts'
import type { Solution } from './hand'
import type { Concept } from './types'

const pool = getAllConcepts();

function waysOn(board: string[], found: Solution[], of: Concept[] = pool): number {
  return formableGroups(board, of, found).length;
}

test('a find brings in one concept, and only one', () => {
  // The reward for finding something is that the board grows, visibly, every
  // single time. It used to be topped up to a number of moves available, which
  // meant a find often dealt nothing at all.
  const board = ['jungle', 'desert', 'forest'];

  const next = topUp(board, pool, []);

  expect(next).toHaveLength(board.length + 1);
  for (const name of board) expect(next).toContain(name);
});

test('and more than one when one would leave nothing to do', () => {
  // Written against a pool of its own, because what is dealt is shuffled: on
  // the real one, a board with no trio on it is often one concept away from
  // having several, and this would then be a test that passed most of the
  // time. Here nothing but a third member can make a trio, whichever two of
  // the three are drawn first.
  const trio: Concept[] = [
    { name: 'a', properties: ['x', 'y'] },
    { name: 'b', properties: ['x', 'y'] },
    { name: 'c', properties: ['x', 'y'] },
  ];
  expect(waysOn(['a'], [], trio)).toBe(0);

  const next = topUp(['a'], trio, []);

  expect(next).toHaveLength(3);
  expect(waysOn(next, [], trio)).toBeGreaterThan(0);
});

test('nothing is dealt twice, and nothing finished is dealt at all', () => {
  const found: Solution[] = [{ property: 'biome', concepts: ['jungle', 'desert', 'forest'] }];
  let board = ['jungle', 'desert', 'forest'];
  for (let i = 0; i < 12; i++) board = topUp(board, pool, found);

  expect(new Set(board).size).toBe(board.length);
});

test('a game with nothing useful left is handed back as it is, rather than hanging', () => {
  // The floor is "keep dealing until there is a move", and the thing that must
  // never happen is looking for one that does not exist.
  const tiny: Concept[] = [
    { name: 'a', properties: ['x', 'y'] },
    { name: 'b', properties: ['x', 'y'] },
  ];

  expect(topUp(['a', 'b'], tiny, [])).toEqual(['a', 'b']);
});

test('the board keeps something to do, one find at a time, to the end of the game', () => {
  let board = ['jungle', 'desert', 'forest'];
  const found: Solution[] = [];

  while (true) {
    const groups = formableGroups(board, pool, found);
    if (groups.length === 0) break;

    found.push(groups[0]);
    board = topUp(board, pool, found);

    // Whatever is still findable somewhere must still be findable here.
    if (formableGroups(pool.map((c) => c.name), pool, found).length > 0) {
      expect(waysOn(board, found)).toBeGreaterThan(0);
    }
  }

  expect(found.length).toBeGreaterThan(90);
});
