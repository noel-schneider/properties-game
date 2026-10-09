import type { Point } from './useBubbleLayout'

/**
 * The outlines of the found groups, and what to do where two of them run
 * between the same pair of bubbles.
 *
 * A concept belongs to several categories at once, so two groups often share
 * two of their three members — and then they share a side. Drawn on the same
 * track the second paints over the first, and a board that has found both
 * says it found one.
 */

/** One member of a group, and where it currently sits. */
export interface Corner {
    name: string;
    at: Point;
}

/** One drawn side of a group's outline, after any shifting. */
export interface Side {
    from: Point;
    to: Point;
}

/** How far apart two groups' copies of the same side are drawn. */
export const SIDE_SHIFT = 7;

/**
 * The corners in the order they sit around their own middle.
 *
 * In any other order the shape crosses itself, which is what happens every
 * time the simulation moves one member past another.
 */
export function aroundTheMiddle(corners: Corner[]): Corner[] {
    const middle = {
        x: corners.reduce((sum, c) => sum + c.at.x, 0) / corners.length,
        y: corners.reduce((sum, c) => sum + c.at.y, 0) / corners.length,
    };

    return [...corners].sort(
        (a, b) =>
            Math.atan2(a.at.y - middle.y, a.at.x - middle.x) -
            Math.atan2(b.at.y - middle.y, b.at.x - middle.x),
    );
}

/** The pairs of corners a group draws a line between, each pair once. */
function sidesOf(corners: Corner[]): Array<[Corner, Corner]> {
    // Two corners make one side. Walking round would draw it there and back.
    if (corners.length === 2) return [[corners[0], corners[1]]];

    return corners.map((corner, i) => [corner, corners[(i + 1) % corners.length]]);
}

/** A side's name, whichever end it is read from. */
function track(a: Corner, b: Corner): string {
    return [a.name, b.name].sort().join('|');
}

/**
 * Where each group draws each of its sides, with the ones they share fanned
 * out so that every category can be seen.
 *
 * The copies sit either side of the track rather than all to one side of it:
 * a side nobody shares and a side two groups share should look like the same
 * line, thickened, and not like a line that has drifted.
 */
export function fannedSides(groups: Corner[][]): Side[][] {
    const sharing = new Map<string, number[]>();

    groups.forEach((corners, group) => {
        for (const [a, b] of sidesOf(corners)) {
            const key = track(a, b);
            const users = sharing.get(key) ?? [];
            if (!users.includes(group)) users.push(group);
            sharing.set(key, users);
        }
    });

    return groups.map((corners, group) =>
        sidesOf(corners).map(([a, b]) => {
            const users = sharing.get(track(a, b)) ?? [group];
            const shift = (users.indexOf(group) - (users.length - 1) / 2) * SIDE_SHIFT;
            if (shift === 0) return { from: a.at, to: b.at };

            // Measured along the side's own name rather than the direction
            // this group happens to draw it in: the two groups walk their
            // outlines in opposite directions as often as not, and a push
            // "to the left" would then land both copies on the same track.
            const [near, far] = a.name < b.name ? [a, b] : [b, a];
            const run = Math.hypot(far.at.x - near.at.x, far.at.y - near.at.y);
            // Two members on top of one another have no side to be pushed off.
            if (run === 0) return { from: a.at, to: b.at };

            const across = {
                x: -((far.at.y - near.at.y) / run) * shift,
                y: ((far.at.x - near.at.x) / run) * shift,
            };
            return {
                from: { x: a.at.x + across.x, y: a.at.y + across.y },
                to: { x: b.at.x + across.x, y: b.at.y + across.y },
            };
        }),
    );
}

const place = (point: Point): string => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`;

/**
 * The path for one group's sides: one closed shape where they still join up,
 * and a line each where being fanned out has pulled them apart.
 */
export function pathOf(sides: Side[]): string {
    const joined = sides.every(
        (side, i) => place(side.to) === place(sides[(i + 1) % sides.length].from),
    );

    if (joined && sides.length > 2) {
        // The last side's far end is the first side's near end, and `Z` is
        // what draws it: naming it as well leaves a line drawn twice.
        const steps = sides.slice(0, -1).map((side) => `L ${place(side.to)}`);
        return `M ${place(sides[0].from)} ${steps.join(' ')} Z`;
    }

    return sides.map((side) => `M ${place(side.from)} L ${place(side.to)}`).join(' ');
}
