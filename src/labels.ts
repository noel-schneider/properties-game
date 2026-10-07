import type { Point } from './useBubbleLayout'

/** The least room two names need between them to be read as two. */
export const LABEL_CLEARANCE = 24;

/**
 * Pushes names apart that would otherwise land on one another.
 *
 * A concept belongs to several found categories at once, and pointing at one
 * names all of them — so several arrive together, and two groups sharing that
 * concept often share most of their middle too. Their names land stacked and
 * neither can be read.
 *
 * Only names that actually overlap may move each other, which is why this needs
 * their widths. Owing every name a push below the one before it however far
 * away it sat is invisible at two and a ladder at six: a group grown past three
 * by concepts dropped into it has its middle a long way from the concept being
 * pointed at, and those two names have no quarrel.
 *
 * Only downward, and only vertically: a name that wandered sideways would stop
 * pointing at the group it belongs to.
 */
export function spreadLabels(places: Point[], widths: number[]): Point[] {
    const order = places
        .map((place, index) => ({ place, index }))
        .sort((a, b) => a.place.y - b.place.y);

    const spread: Point[] = new Array(places.length);
    const settled: Array<{ x: number; y: number; width: number }> = [];

    for (const { place, index } of order) {
        const width = widths[index];
        let y = place.y;

        // Walked until nothing is in the way: a push clears one name and can
        // bring it onto the next, so every push reopens the whole question.
        //
        // Bounded, because this runs while the board is being drawn: a name a
        // few pixels from where it belongs is a blemish, and a walk that never
        // ends is a frozen game. One pass per name already settled is more than
        // any real board needs.
        for (let pushed = true, walks = 0; pushed && walks <= settled.length; walks++) {
            pushed = false;
            for (const other of settled) {
                // Half of each name reaches out from its own middle.
                if (Math.abs(place.x - other.x) >= (width + other.width) / 2) continue;

                const below = other.y + LABEL_CLEARANCE;
                // Compared against the very value a push would assign, so that
                // a push always moves the name. Asking whether the gap has
                // reached the clearance reads the same and is not: after
                // `y = other.y + 24`, `y - other.y` can come back as
                // 23.999999999999996, and the name is then pushed to where it
                // already is for as long as anyone waits.
                if (y >= below || y <= other.y - LABEL_CLEARANCE) continue;

                y = below;
                pushed = true;
            }
        }

        spread[index] = { x: place.x, y };
        settled.push({ x: place.x, y, width });
    }

    return spread;
}
