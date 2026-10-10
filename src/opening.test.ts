import { formableGroups, openingBoard, WAYS_ON } from './board'
import { getAllConcepts } from './concepts'
import { pinTheScatter } from './test-utils'

const pool = getAllConcepts()

afterEach(() => vi.restoreAllMocks())

test('nobody is handed the board the last player had', () => {
  // It used to be written down, so that a first board could never be a wall.
  // What it was instead was the same wall every time: four trios, and every
  // one of them answering to two names at once — chocolate, honey and cake
  // are food *and* sweet; ant, bee and ladybug are insect *and* animal.
  // A player's first lesson was that the game wanted one of two right answers
  // and would not say which.
  const boards = Array.from({ length: 20 }, () => openingBoard(pool, WAYS_ON).join(','))

  expect(new Set(boards).size).toBeGreaterThan(1)
})

test('but every board it deals can be played the moment it arrives', () => {
  // The reason the opening was written down in the first place, and the one
  // part of it worth keeping: a board you cannot start is not a start.
  pinTheScatter()

  for (let attempt = 0; attempt < 40; attempt++) {
    const board = openingBoard(pool, WAYS_ON)
    expect(formableGroups(board, pool, []).length, board.join(',')).toBeGreaterThanOrEqual(WAYS_ON)
  }
})

test('and holds something that cannot be used yet', () => {
  // Not everything on the board is part of an answer, and finding that out on
  // the first board is kinder than finding it out on the twentieth.
  pinTheScatter()

  for (let attempt = 0; attempt < 40; attempt++) {
    const board = openingBoard(pool, WAYS_ON)
    const used = new Set(formableGroups(board, pool, []).flatMap((group) => group.concepts))

    expect(board.some((name) => !used.has(name)), board.join(',')).toBe(true)
  }
})

test('and rarely asks three concepts to answer to two names at once', () => {
  // The whole point of dealing. Measured over two hundred boards from a fixed
  // sequence, so the number is the same on every run: about one trio in
  // twenty-five carries a second name, against four in five on the board this
  // replaced.
  pinTheScatter()

  let trios = 0
  let doubled = 0
  for (let attempt = 0; attempt < 200; attempt++) {
    const byMembers = new Map<string, number>()
    for (const group of formableGroups(openingBoard(pool, WAYS_ON), pool, [])) {
      const key = [...group.concepts].sort().join('|')
      byMembers.set(key, (byMembers.get(key) ?? 0) + 1)
    }
    trios += byMembers.size
    doubled += [...byMembers.values()].filter((names) => names > 1).length
  }

  expect(trios).toBeGreaterThan(0)
  expect(doubled / trios).toBeLessThan(0.2)
})
