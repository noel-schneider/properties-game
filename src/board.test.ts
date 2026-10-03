import { formableGroups, openingBoard, refill, WAYS_ON } from './board'
import { getAllConcepts } from './concepts'
import type { Solution } from './hand'

const pool = getAllConcepts();

/** What the board is now topped up by: moves available, not concepts present. */
const ACTIVE = WAYS_ON;

function waysOn(board: string[], found: Solution[]): number {
  return formableGroups(board, pool, found).length;
}

test('an opening board offers the asked-for number of ways on, or a few more', () => {
  const board = openingBoard(pool, ACTIVE);

  // A few over because one concept dealt in can open several groups at once,
  // and stopping short of that would mean taking it back out again.
  expect(waysOn(board, [])).toBeGreaterThanOrEqual(ACTIVE);
  expect(new Set(board).size).toBe(board.length);
});

test('an opening board can always be played', () => {
  for (let i = 0; i < 200; i++) {
    expect(formableGroups(openingBoard(pool, ACTIVE), pool, []).length).toBeGreaterThan(0);
  }
});

test('a group is only formable while its property is open for all three', () => {
  const board = ['jungle', 'desert', 'forest'];
  const groups = formableGroups(board, pool, []);
  expect(groups.map((g) => g.property)).toContain('biome');

  const spent: Solution[] = [{ property: 'biome', concepts: board }];
  expect(formableGroups(board, pool, spent).map((g) => g.property)).not.toContain('biome');
});

test('refilling brings the board back to the asked-for number of ways on', () => {
  const found: Solution[] = [{ property: 'biome', concepts: ['jungle', 'desert', 'forest'] }];
  const thin = refill(['jungle', 'desert'], pool, found, ACTIVE);

  expect(waysOn(thin, found)).toBeGreaterThanOrEqual(ACTIVE);
});

test('refilling never drops a concept already on the board', () => {
  const board = openingBoard(pool, ACTIVE);
  const refilled = refill(board, pool, [], ACTIVE);

  for (const name of board) expect(refilled).toContain(name);
});

test('the board offers something to find until the game itself is exhausted', () => {
  // A category of N members yields floor(N/3) groups and strands the rest, so
  // the game ends when nothing can be formed anywhere — not when every concept
  // is finished, which the arithmetic forbids.
  let board = openingBoard(pool, ACTIVE);
  const found: Solution[] = [];

  while (true) {
    const groups = formableGroups(board, pool, found);
    if (groups.length === 0) break;

    found.push(groups[0]);
    board = refill(board, pool, found, ACTIVE);

    // Whatever remains unfound anywhere must still be unformable on the board.
    const everywhere = formableGroups(pool.map((c) => c.name), pool, found);
    if (everywhere.length > 0) {
      expect(formableGroups(board, pool, found).length).toBeGreaterThan(0);
    }
  }

  expect(found.length).toBeGreaterThan(90);
  expect(formableGroups(pool.map((c) => c.name), pool, found)).toEqual([]);
});
