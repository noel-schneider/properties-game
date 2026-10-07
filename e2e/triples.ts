import data from '../src/concepts.json' with { type: 'json' }

/** Every concept in the game, and the properties it carries. */
export const conceptProperties = data as Record<string, string[]>

const properties = conceptProperties

/**
 * Three concepts on screen that share a property, plus that property.
 *
 * `avoid` leaves out properties already named, for a test that needs a second
 * find to be a different category from the first.
 */
export function findSolvableTriple(
  dealt: string[],
  avoid: string[] = [],
): { names: string[]; property: string } {
  for (let a = 0; a < dealt.length; a++) {
    for (let b = a + 1; b < dealt.length; b++) {
      for (let c = b + 1; c < dealt.length; c++) {
        const triple = [dealt[a], dealt[b], dealt[c]]
        const property = properties[triple[0]].find((p) =>
          !avoid.includes(p) && triple.every((name) => properties[name].includes(p)),
        )
        if (property) return { names: triple, property }
      }
    }
  }
  throw new Error('the dealt hand has no solvable triple, which dealHand should prevent')
}
