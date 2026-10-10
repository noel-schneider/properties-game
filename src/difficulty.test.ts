import { getAllConcepts } from './concepts'
import { CATEGORY_LEVELS, LEVELS, PAIR_LEVELS, levelOf, spread } from './difficulty'

const pool = getAllConcepts()
const pairs = pool.flatMap((concept) => concept.properties.map((property) => [concept.name, property] as const))

test('every category the game knows has been judged', () => {
  // A category with no level cannot be dealt early or late, and would quietly
  // fall out of whichever end of the game it was meant to be in.
  for (const property of new Set(pool.flatMap((concept) => concept.properties))) {
    expect(CATEGORY_LEVELS[property], property).toBeDefined()
  }
})

test('and nothing has been judged that the game does not know', () => {
  // A level left behind by a renamed category is a judgement about nothing,
  // and the next person to read the file would believe it.
  const known = new Set(pool.flatMap((concept) => concept.properties))

  for (const property of Object.keys(CATEGORY_LEVELS)) {
    expect(known.has(property), property).toBe(true)
  }
})

test('every level named is one of the three', () => {
  for (const [property, level] of Object.entries(CATEGORY_LEVELS)) {
    expect(LEVELS, property).toContain(level)
  }
  for (const [pair, level] of Object.entries(PAIR_LEVELS)) {
    expect(LEVELS, pair).toContain(level)
  }
})

test('an exception names a pair that exists', () => {
  const real = new Set(pairs.map(([concept, property]) => `${concept}|${property}`))

  for (const pair of Object.keys(PAIR_LEVELS)) {
    expect(real.has(pair), pair).toBe(true)
  }
})

test('and it disagrees with its category, or it is not an exception', () => {
  // An exception that repeats what the category already says is a line
  // nobody can tell from a mistake.
  for (const [pair, level] of Object.entries(PAIR_LEVELS)) {
    const property = pair.split('|')[1]
    expect(level, pair).not.toBe(CATEGORY_LEVELS[property])
  }
})

test('a pair takes its exception over its category', () => {
  const [pair, level] = Object.entries(PAIR_LEVELS)[0]
  const [concept, property] = pair.split('|')

  expect(levelOf(concept, property)).toBe(level)
  expect(levelOf(concept, property)).not.toBe(CATEGORY_LEVELS[property])
})

test('a pair with no exception takes its category', () => {
  expect(levelOf('bread', 'food')).toBe(CATEGORY_LEVELS['food'])
})

test('every pair in the game can be asked how hard it is', () => {
  for (const [concept, property] of pairs) {
    expect(LEVELS, `${concept}|${property}`).toContain(levelOf(concept, property))
  }
})

test('the game is not all one difficulty', () => {
  // The balance this exists to make visible. No level empty, and none of them
  // swallowing the game: a board dealt by difficulty needs enough easy pairs
  // to open on and enough hard ones to finish with.
  const counted = spread(pool)
  const total = pairs.length

  for (const level of LEVELS) {
    expect(counted[level], level).toBeGreaterThan(total * 0.08)
    expect(counted[level], level).toBeLessThan(total * 0.7)
  }
})

test('and it leans towards the easy end, where a game has to start', () => {
  const counted = spread(pool)

  expect(counted.easy).toBeGreaterThan(counted.hard)
})
