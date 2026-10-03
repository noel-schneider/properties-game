import type { Point } from './useBubbleLayout'

/** The least room two names need between them to be read as two. */
export const LABEL_CLEARANCE = 24;

/**
 * Pushes names apart that would otherwise land on one another.
 *
 * A concept can belong to several found categories at once, and naming them
 * all is the whole point of reading a concept — but two groups sharing a
 * member often share most of their middle too, so their names arrive stacked
 * and neither can be read.
 *
 * Only downward, and only vertically: a name that wandered sideways would
 * stop pointing at the group it belongs to.
 */
export function spreadLabels(places: Point[]): Point[] {
    const order = places
        .map((place, index) => ({ place, index }))
        .sort((a, b) => a.place.y - b.place.y);

    const spread: Point[] = new Array(places.length);
    let floor = -Infinity;

    for (const { place, index } of order) {
        const y = Math.max(place.y, floor);
        spread[index] = { x: place.x, y };
        floor = y + LABEL_CLEARANCE;
    }

    return spread;
}
