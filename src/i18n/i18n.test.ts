import en from './en.json'
import fr from './fr.json'
import { CATALOGUE } from '../achievements/catalogue'
import { getAllConcepts } from '../concepts'

const languages = { en, fr };
const concepts = getAllConcepts();
const properties = [...new Set(concepts.flatMap((c) => c.properties))];

describe.each(Object.entries(languages))('%s', (_name, locale) => {
  test('names every concept on the board', () => {
    const missing = concepts.map((c) => c.name).filter((id) => !locale.concepts[id as keyof typeof locale.concepts]);

    expect(missing).toEqual([]);
  });

  test('names every category a player has to answer', () => {
    const missing = properties.filter((id) => !locale.properties[id as keyof typeof locale.properties]);

    expect(missing).toEqual([]);
  });

  test('offers other wordings for every category', () => {
    const bare = properties.filter(
      (id) => (locale.aliases[id as keyof typeof locale.aliases] ?? []).length === 0,
    );

    expect(bare).toEqual([]);
  });

  test('names and describes every achievement', () => {
    const missing = CATALOGUE.filter((a) => !locale.achievements[a.id as keyof typeof locale.achievements]);

    expect(missing.map((a) => a.id)).toEqual([]);
  });
});

test('the two languages carry exactly the same keys', () => {
  const keysOf = (locale: typeof en) => [
    ...Object.keys(locale.concepts).map((k) => `concept:${k}`),
    ...Object.keys(locale.properties).map((k) => `property:${k}`),
    ...Object.keys(locale.ui).map((k) => `ui:${k}`),
    ...Object.keys(locale.achievements).map((k) => `achievement:${k}`),
  ].sort();

  expect(keysOf(fr)).toEqual(keysOf(en));
});

/**
 * Words that really are the same in both languages. Anything else coming back
 * identical is a string that was forgotten rather than translated.
 */
const IDENTICAL_IN_BOTH = new Set([
  'concepts:atlas', 'concepts:avalanche', 'concepts:bowling', 'concepts:casino', 'concepts:bus', 'concepts:crocodile',
  'concepts:dune', 'concepts:football', 'concepts:glacier', 'concepts:igloo',
  'concepts:jungle', 'concepts:piano', 'concepts:pizza', 'concepts:radio',
  'concepts:robot', 'concepts:satellite', 'concepts:tennis', 'concepts:train',
  'properties:animal', 'properties:communication', 'properties:danger',
  'properties:exploration', 'properties:machine', 'properties:reptile',
  'properties:art', 'properties:sport', 'properties:transport',
  'ui:graph.label', 'ui:panel.secretName', 'ui:language.en', 'ui:language.fr',
]);

test('nothing was left untranslated in French', () => {
  const untranslated: string[] = [];

  for (const section of ['concepts', 'properties', 'ui'] as const) {
    for (const [key, value] of Object.entries(fr[section])) {
      const sameAsEnglish = value === (en[section] as Record<string, string>)[key];
      if (sameAsEnglish && !IDENTICAL_IN_BOTH.has(`${section}:${key}`)) {
        untranslated.push(`${section}:${key}`);
      }
    }
  }

  expect(untranslated).toEqual([]);
});

test('each language accepts wordings the other does not', () => {
  // Some words are spelled the same in both — "instrument", "cosmos" — and an
  // overlap is no defect. What matters is that each language brings its own.
  for (const [id, aliases] of Object.entries(fr.aliases)) {
    const english = (en.aliases as Record<string, string[]>)[id] ?? [];
    const own = (aliases as string[]).filter((alias) => !english.includes(alias));

    expect(own.length, `no French wording of its own for "${id}"`).toBeGreaterThan(0);
  }
});

/** The same folding the game applies to an answer before comparing it. */
function fold(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ');
  return base.endsWith('s') ? base.slice(0, -1) : base;
}

describe.each(Object.entries(languages))('%s wordings', (_name, locale) => {
  test('no category answers to the name of another', () => {
    // Otherwise a player naming one category is credited with a different one.
    // This is what made 'sound' unusable while music still accepted it.
    const named = new Map(Object.entries(locale.properties).map(([id, label]) => [fold(label), id]));

    const stolen: string[] = [];
    for (const [id, aliases] of Object.entries(locale.aliases)) {
      for (const alias of aliases as string[]) {
        const owner = named.get(fold(alias));
        if (owner && owner !== id) stolen.push(`${id} answers to "${alias}", the name of ${owner}`);
      }
    }

    expect(stolen).toEqual([]);
  });
});

test('every category answers to its own id in English', () => {
  // The ids are English words and the game is played in English by default, so
  // a player typing the id is typing a reasonable answer. Renaming "colors" to
  // "colourful" and forgetting the old spelling left a category that could not
  // be answered by the word it is named after — which surfaced as a suite that
  // failed one run in three, whenever the board happened to offer that trio.
  const refused: string[] = [];
  for (const id of properties) {
    const label = (en.properties as Record<string, string>)[id];
    const aliases = (en.aliases as Record<string, string[]>)[id] ?? [];
    const accepted = new Set([label, ...aliases].map(fold));
    if (!accepted.has(fold(id))) refused.push(id);
  }

  expect(refused).toEqual([]);
});
