import { hintPair, HINT_FIRST, HINT_AGAIN, HINT_SHOWN } from './hints'
import type { Solution } from './hand'

const groups: Solution[] = [
  { property: 'insect', concepts: ['ant', 'bee', 'moth'] },
  { property: 'metal', concepts: ['coin', 'key', 'bell'] },
];

test('a hint is two of a trio that can be made, never the third', () => {
  // Two is a push; three is the answer handed over. Naming it is the other
  // half of the game and stays with the player.
  const pair = hintPair(groups, 0)!;

  expect(pair).toHaveLength(2);
  expect(groups.some((g) => pair.every((name) => g.concepts.includes(name)))).toBe(true);
});

test('the next hint is a different pair, or it reads as the same nudge twice', () => {
  const seen = new Set<string>();
  for (let step = 0; step < 4; step++) seen.add(hintPair(groups, step)!.join('+'));

  expect(seen.size).toBe(4);
});

test('two groups sharing two members are still nudged at differently', () => {
  // Boards are full of these: "drum, radio, bell" for sound and "drum, radio,
  // phone" for machine. Taking the first two of each pointed at drum and radio
  // twice running, which looks like the board repeating itself.
  const overlapping: Solution[] = [
    { property: 'sound', concepts: ['drum', 'radio', 'bell'] },
    { property: 'machine', concepts: ['drum', 'radio', 'phone'] },
  ];

  expect(hintPair(overlapping, 0)).not.toEqual(hintPair(overlapping, 1));
});

test('a board with nothing left to find is nudged about nothing', () => {
  expect(hintPair([], 3)).toBeNull();
});

test('the one group left can still be hinted at, twice over', () => {
  const only = [groups[0]];

  expect(hintPair(only, 0)).not.toEqual(hintPair(only, 1));
  expect(hintPair(only, 0)!.every((name) => only[0].concepts.includes(name))).toBe(true);
});

test('the waits are the ones that were agreed, and the glow is brief', () => {
  expect(HINT_FIRST).toBe(45_000);
  expect(HINT_AGAIN).toBe(25_000);
  expect(HINT_SHOWN).toBeLessThan(HINT_AGAIN);
});
