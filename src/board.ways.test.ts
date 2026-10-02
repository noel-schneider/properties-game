import { getAllConcepts } from './concepts'
import { formableGroups, openingBoard, refill, WAYS_ON } from './board'
import { getNRandomElements } from './utils'
import type { Solution } from './hand'

const pool = getAllConcepts();

function ways(board: string[], found: Solution[]) {
  return formableGroups(board, pool, found).length;
}

test('a fresh board offers about as many ways on as asked', () => {
  for (let go = 0; go < 20; go++) {
    const board = openingBoard(pool, WAYS_ON);
    expect(ways(board, [])).toBeGreaterThanOrEqual(WAYS_ON);
  }
});

test('topping up stops once there are enough ways on', () => {
  // Not "exactly enough": one concept can open several groups at once, and
  // stopping short of that would mean undoing it.
  const board = openingBoard(pool, WAYS_ON);
  const found: Solution[] = [formableGroups(board, pool, [])[0]];

  const after = refill(board, pool, found, WAYS_ON);
  expect(ways(after, found)).toBeGreaterThanOrEqual(WAYS_ON);
});

test('the number of ways on is not the same every time', () => {
  // The board shows this count. Topping up to exactly the same number every
  // time would turn it into a constant, which tells the player nothing — and
  // worse, a count that never moves is a count they learn to read as a hint.
  const counts = new Set<number>();
  for (let go = 0; go < 30; go++) {
    counts.add(ways(openingBoard(pool, WAYS_ON), []));
  }

  expect(counts.size).toBeGreaterThan(1);
});

test('a board is never dealt with nothing to do', () => {
  for (let go = 0; go < 20; go++) {
    expect(ways(openingBoard(pool, WAYS_ON), [])).toBeGreaterThan(0);
  }
});

test('it stops rather than spinning when the pool cannot offer that many', () => {
  // Late in a game almost nothing is left; asking for three ways on must not
  // mean adding every concept in the game looking for them.
  const found: Solution[] = [];
  let board = openingBoard(pool, WAYS_ON);
  for (let round = 0; round < 200; round++) {
    const groups = formableGroups(board, pool, found);
    if (groups.length === 0) break;
    found.push(getNRandomElements(groups, 1)[0]);
    board = refill(board, pool, found, WAYS_ON);
  }

  expect(formableGroups(board, pool, found)).toHaveLength(0);
});
