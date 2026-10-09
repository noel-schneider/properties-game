/**
 * How a found category shows itself while one of its concepts is pointed at.
 *
 * Pointing at a concept names every category it is in, and those names arrive
 * together: two of them land within a few pixels of one another, because two
 * groups sharing that concept share most of their middle too. A colour is what
 * tells one name from the next, and tells which three bubbles each one is
 * talking about.
 */

/**
 * Which marks a reveal wears, in the order the bench offers them: none at
 * all, then the outlines, then one of the two ways of marking a bubble, then
 * the same two with the whole board coloured rather than one concept's share
 * of it.
 */
export const REVEALS = ['plain', 'loops', 'arcs', 'rings', 'all-arcs', 'all-rings'] as const;

/** Which marks a reveal wears. Compared side by side before one is kept. */
export type Reveal = (typeof REVEALS)[number];

/**
 * Whether every category still on the board takes a colour, or only the ones
 * the pointed concept is in.
 *
 * Colouring them all untangles the loops that cross between the same bubbles,
 * which no closed shape on its own can do. What it costs is the answer to
 * "which of these is about the thing I am pointing at" — so the marks on the
 * bubbles stay with the pointed concept's own categories, and the rest of the
 * board is coloured and quiet.
 */
export function coloursEverything(reveal: Reveal): boolean {
    return reveal === 'all-arcs' || reveal === 'all-rings';
}

/** Which mark a reveal puts on the bubbles, if it puts one at all. */
export function marksOf(reveal: Reveal): 'arcs' | 'rings' | null {
    if (reveal === 'arcs' || reveal === 'all-arcs') return 'arcs';
    if (reveal === 'rings' || reveal === 'all-rings') return 'rings';
    return null;
}

/**
 * The colours a reveal may use.
 *
 * Five, because five is the most properties one concept can carry and no two
 * of its categories may share a colour. Each one has to be read on the almost
 * black sky *and* on an almost white bubble, which rules out anything very
 * pale or very dark — these sit in the middle on purpose.
 */
export const HUES = [
    '#ffad69', // the game's own orange
    '#6fcfd0', // teal
    '#b48cff', // violet
    '#ff7fa5', // pink
    '#9fd356', // green
] as const;

/**
 * A number from a name, so a category keeps its colour whoever is pointed at.
 *
 * Handing colours out in the order the categories arrive would have made the
 * same category change colour depending on which of its concepts the pointer
 * was over — the one thing a colour code may not do.
 */
function hash(name: string): number {
    let total = 0;
    for (let i = 0; i < name.length; i++) total = (total * 31 + name.charCodeAt(i)) >>> 0;
    return total;
}

/**
 * A colour for each category, the earliest ones never twice.
 *
 * Two names can want the same colour, and then the second takes the next one
 * free: telling two categories apart beats keeping either one's preference.
 *
 * Past the palette the colours go round again, so order is what matters here.
 * The categories the pointed concept is in come first, because those are the
 * ones the player is being asked to tell apart; the rest of the board is only
 * being untangled, and two loops in the same colour at opposite corners untangle
 * each other fine.
 */
export function huesFor(properties: string[]): Map<string, string> {
    let taken = new Set<number>();
    const hues = new Map<string, string>();

    for (const property of properties) {
        // Every colour spoken for: start the round again rather than hunt for
        // a free one that no longer exists.
        if (taken.size >= HUES.length) taken = new Set<number>();

        let slot = hash(property) % HUES.length;
        while (taken.has(slot)) slot = (slot + 1) % HUES.length;
        taken.add(slot);
        hues.set(property, HUES[slot]);
    }

    return hues;
}

/** The break cut between two slices of a ring, so they read as two. */
export const ARC_GAP = 10;

/**
 * One slice of a ring: the dash that draws it and the offset that puts it in
 * its place. A concept in three of the categories on show wears three.
 */
export function arcDash(radius: number, count: number, index: number): { dash: number; offset: number } {
    const round = 2 * Math.PI * radius;
    const slice = round / count;

    // A lone slice has nothing to be told apart from, and a break cut into it
    // would read as a gauge that stopped short.
    return { dash: count === 1 ? round : slice - ARC_GAP, offset: -slice * index };
}

/**
 * How far past a bubble's edge the coloured marks start.
 *
 * Clear of both rings already drawn out here: the gauge at plus seven and the
 * nudge at plus thirteen. A colour crossing either would be read as part of
 * it — and the nudge is on the board at exactly the moment a player is
 * hunting for what goes with what.
 */
export const MARK_START = 19;

/** Clear space between one coloured ring and the next. */
const RING_STEP = 6;

/** The radius of one of a concept's coloured rings, innermost first. */
export function ringRadius(radius: number, index: number): number {
    return radius + MARK_START + RING_STEP * index;
}
