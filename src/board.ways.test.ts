import { getAllConcepts } from './concepts'
import { formableGroups, openingBoard, refill, WAYS_ON, waysWanted } from './board'
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

test('the number aimed at moves from deal to deal', () => {
  // The board shows how many ways on it has. Aiming at the same number every
  // time leaves the count sitting on it, and a count that never moves is one
  // the player stops reading — or learns to read as a tell.
  //
  // This is what guards the drawing. The test below, on the counts the board
  // actually ends up with, passes either way: one concept dealt in can open
  // several groups at once, so some spread exists even with a fixed target.
  const aimed = new Set<number>();
  for (let go = 0; go < 200; go++) aimed.add(waysWanted());

  expect(aimed.size).toBeGreaterThan(1);
  expect(Math.min(...aimed)).toBeGreaterThanOrEqual(WAYS_ON - 1);
  expect(Math.max(...aimed)).toBeLessThanOrEqual(WAYS_ON + 1);
});

test('and the count a top-up lands on is not fixed either', () => {
  // Measured on a top-up rather than on an opening: everybody now starts from
  // the same written board, so the first count is the same for everybody by
  // design. It is every board after it that must not sit on one number.
  const counts = new Set<number>();
  const found: Solution[] = [{ property: 'food', concepts: ['chocolate', 'honey', 'cake'] }];

  for (let go = 0; go < 30; go++) {
    counts.add(ways(refill(['ant', 'bee', 'ladybug'], pool, found, waysWanted()), found));
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
