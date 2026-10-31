import { ceilingFor, formableGroups, openingBoard, refill, WAYS_ON } from './board'
import { getAllConcepts } from './concepts'
import { LEVELS, levelOf } from './difficulty'
import { pinTheScatter } from './test-utils'
import type { Solution } from './hand'

const pool = getAllConcepts()

afterEach(() => vi.restoreAllMocks())

test('the ceiling starts at the easy end and only ever rises', () => {
  expect(ceilingFor(0)).toBe('easy')

  const reached = Array.from({ length: 60 }, (_, finds) => LEVELS.indexOf(ceilingFor(finds)))
  expect([...reached].sort((a, b) => a - b)).toEqual(reached)
  expect(ceilingFor(60)).toBe('hard')
})

test('a first board always has something easy to find on it', () => {
  // The promise the written opening used to make, kept by the deal instead:
  // whatever else is on the board, a new player has a way in that does not
  // ask them to name an abstraction.
  pinTheScatter()

  for (let attempt = 0; attempt < 40; attempt++) {
    const board = openingBoard(pool, WAYS_ON)
    const offered = formableGroups(board, pool, [])

    expect(
      offered.some((group) => group.concepts.every((name) => levelOf(name, group.property) === 'easy')),
      board.join(','),
    ).toBe(true)
  }
})

test('the ceiling is a preference, never a gate', () => {
  // Late in a game everything easy is spent. A deal that insisted on the
  // ceiling would hand back a board with nothing on it rather than a hard
  // one, which is the difference between a game and a wall.
  pinTheScatter()

  // Every easy category in the game, used up.
  const spent: Solution[] = []
  for (const concept of pool) {
    for (const property of concept.properties) {
      if (levelOf(concept.name, property) !== 'easy') continue
      if (spent.some((group) => group.property === property && group.concepts.includes(concept.name))) continue

      const members = pool
        .filter((other) => other.properties.includes(property))
        .map((other) => other.name)
      if (members.length >= 3) spent.push({ property, concepts: members.slice(0, 3) })
    }
  }

  const board = refill([], pool, spent, WAYS_ON)
  expect(formableGroups(board, pool, spent).length).toBeGreaterThan(0)
})

test('and a board late in a game is allowed to be hard', () => {
  // The other half of rising: by then the deal must be willing to put the
  // abstractions in front of a player who has earned them.
  expect(ceilingFor(40)).toBe('hard')
})
