import { CONCEPTS_PER_GROUP, dealRound, getAllConcepts } from './concepts'

const concepts = getAllConcepts();

function conceptsByProperty(): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const concept of concepts) {
    for (const property of concept.properties) {
      index.set(property, [...(index.get(property) ?? []), concept.name]);
    }
  }
  return index;
}

test('every property can actually be an answer', () => {
  // A property owned by fewer than three concepts can never be guessed. It is
  // dead weight that makes the pool look richer than it plays.
  const tooRare = [...conceptsByProperty().entries()]
    .filter(([, names]) => names.length < CONCEPTS_PER_GROUP)
    .map(([property, names]) => `${property} (${names.length})`);

  expect(tooRare).toEqual([]);
});

test('every concept belongs to at least two categories', () => {
  // One property per concept means groups never overlap, and the player is
  // never made to choose between two readings.
  const tooThin = concepts.filter((c) => c.properties.length < 2).map((c) => c.name);

  expect(tooThin).toEqual([]);
});

test('every deal offers three separate groups to find', () => {
  for (let i = 0; i < 100; i++) {
    expect(dealRound().solutions).toHaveLength(3);
  }
});

test('a board always offers something still missing, so the game can be finished', () => {
  const all = [...new Set(getAllConcepts().flatMap((c) => c.properties))];
  const found = all.filter((p) => p !== all[0]);

  for (let i = 0; i < 40; i++) {
    expect(dealRound(found).solutions.map((s) => s.property)).toContain(all[0]);
  }
});
