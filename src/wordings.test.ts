import en from './i18n/en.json'
import fr from './i18n/fr.json'
import { getAllConcepts } from './concepts'
import { checkGuess } from './guess'
import type { Wordings } from './guess'
import type { Concept } from './types'

const pool = getAllConcepts();
const byName = new Map(pool.map((concept) => [concept.name, concept]));

/** The same wordings the game plays with, built the way the provider builds them. */
function wordingsOf(locale: typeof en | typeof fr): Wordings {
  return Object.fromEntries(
    Object.entries(locale.properties).map(([id, label]) => [
      id,
      { label, aliases: (locale.aliases as Record<string, string[]>)[id] ?? [] },
    ]),
  );
}

function trio(...names: string[]): Concept[] {
  return names.map((name) => {
    const concept = byName.get(name);
    if (!concept) throw new Error(`${name} is not in the pool`);
    return concept;
  });
}

const words = { en: wordingsOf(en), fr: wordingsOf(fr) };

/**
 * Answers a player wrote that the game turned down.
 *
 * Each line is a word somebody typed in front of a board, not a word somebody
 * imagined at a keyboard. The folding in `normalizeAnswer` only drops accents
 * and a trailing "s", so an irregular plural needs saying out loud.
 */
describe('wordings a player reached for', () => {
  test('"cuisine" names the food category', () => {
    expect(checkGuess(trio('bread', 'cake', 'pizza'), 'cuisine', words.fr)).toBe(true);
  });

  test('"volant" names the airborne category', () => {
    expect(checkGuess(trio('ladybug', 'bee', 'butterfly'), 'volant', words.fr)).toBe(true);
  });

  test('"métaux" and "métallurgie" both name the metal category', () => {
    const metal = trio('coin', 'key', 'sword');

    expect(checkGuess(metal, 'métaux', words.fr)).toBe(true);
    expect(checkGuess(metal, 'métallurgie', words.fr)).toBe(true);
  });
});

describe('the money category', () => {
  const members = pool.filter((concept) => concept.properties.includes('money'));

  test('it is in the data, with enough members to be found', () => {
    expect(members.length).toBeGreaterThanOrEqual(3);
  });

  test('it answers to "argent" in French and to "money" in English', () => {
    const three = members.slice(0, 3);

    expect(checkGuess(three, 'argent', words.fr)).toBe(true);
    expect(checkGuess(three, 'money', words.en)).toBe(true);
  });
});
