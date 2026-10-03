import { getAllConcepts } from './concepts'

const pool = getAllConcepts();
const members = new Map<string, string[]>();
for (const concept of pool) {
  for (const property of concept.properties) {
    members.set(property, [...(members.get(property) ?? []), concept.name]);
  }
}

test('the game is a hundred concepts', () => {
  expect(pool).toHaveLength(100);
});

test('no concept carries only one property, and none carries more than five', () => {
  // One property means a concept serves a single group and then sits there for
  // the rest of the game. More than five and it answers everything.
  for (const concept of pool) {
    expect(concept.properties.length).toBeGreaterThanOrEqual(2);
    expect(concept.properties.length).toBeLessThanOrEqual(5);
  }
});

test('no concept is tagged with the same category twice', () => {
  for (const concept of pool) {
    expect(new Set(concept.properties).size).toBe(concept.properties.length);
  }
});

test('every category has at least three members', () => {
  // Fewer than three can never be found at all: it would sit in the data
  // taking up a concept's property slot and giving nothing back.
  for (const [property, names] of members) {
    expect(names.length, property).toBeGreaterThanOrEqual(3);
  }
});

test('no two categories ask the same question', () => {
  // Identical membership means the same three concepts answer twice, which is
  // a gift rather than a puzzle — `transport` and `vehicle` were exactly that.
  const seen = new Map<string, string>();
  for (const [property, names] of members) {
    const shape = [...names].sort().join(',');
    expect(seen.get(shape), `${property} and ${seen.get(shape)}`).toBeUndefined();
    seen.set(shape, property);
  }
});

test('few enough concepts are left with nobody to pair with', () => {
  // A category of N yields floor(N/3) groups and strands N mod 3. Those
  // leftovers are the stretch at the end of a game where nothing can be
  // formed and the only move is dropping a lone concept into a group already
  // found. It was 63; this is the ceiling that keeps it from creeping back.
  const stranded = [...members.values()].reduce((sum, names) => sum + (names.length % 3), 0);

  expect(stranded).toBeLessThanOrEqual(20);
});
