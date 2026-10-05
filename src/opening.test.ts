import { formableGroups, OPENING, openingBoard, WAYS_ON } from './board'
import { getAllConcepts } from './concepts'

const pool = getAllConcepts()

test('everybody starts from the same board', () => {
  // A first board dealt at random is sometimes a wall. This one is written
  // down, so the first thing anybody meets is the same gentle thing.
  const boards = Array.from({ length: 20 }, () => openingBoard(pool, WAYS_ON).join(','))

  expect(new Set(boards).size).toBe(1)
  expect(boards[0]).toBe(OPENING.join(','))
})

test('the opening is made of concepts the game knows', () => {
  const known = new Set(pool.map((concept) => concept.name))

  for (const name of OPENING) expect(known.has(name), name).toBe(true)
  expect(new Set(OPENING).size).toBe(OPENING.length)
})

test('it opens on categories anybody can name', () => {
  const easy = new Set(['food', 'sweet', 'animal', 'insect', 'object', 'metal', 'small', 'cold', 'white'])
  const offered = formableGroups(OPENING, pool, []).map((group) => group.property)

  expect(offered.length).toBeGreaterThanOrEqual(WAYS_ON)
  for (const property of offered) expect(easy.has(property), property).toBe(true)
})

test('and it holds something that cannot be used yet', () => {
  // Not everything on the board is part of an answer, and finding that out on
  // the first board is kinder than finding it out on the twentieth.
  const used = new Set(formableGroups(OPENING, pool, []).flatMap((group) => group.concepts))

  expect(OPENING.some((name) => !used.has(name))).toBe(true)
})
