import type { Point } from './useBubbleLayout'

/**
 * How far outside a group's own extent a drop still counts.
 *
 * A group is a triangle of moving bubbles, so asking the player to land inside
 * it exactly would make the gesture a test of aim rather than of knowledge.
 */
export const DROP_REACH = 44;

export interface DropTarget {
    /** Where this group sits in the found list. */
    index: number;
    /** Where its members are right now. */
    places: Point[];
}

/**
 * Which found group a dragged concept is over, if any.
 *
 * Measured from the group's middle out to its furthest member, so a sprawling
 * group is easier to hit than a tight one — which is right: a sprawling group
 * covers more of the board, and that is what the player is aiming at.
 */
export function groupUnderPointer(point: Point, groups: DropTarget[]): number | null {
    let best: { index: number; distance: number } | null = null;

    for (const group of groups) {
        if (group.places.length === 0) continue;

        const centre = {
            x: group.places.reduce((sum, p) => sum + p.x, 0) / group.places.length,
            y: group.places.reduce((sum, p) => sum + p.y, 0) / group.places.length,
        };
        const extent = Math.max(...group.places.map((p) => Math.hypot(p.x - centre.x, p.y - centre.y)));
        const distance = Math.hypot(point.x - centre.x, point.y - centre.y);

        if (distance > extent + DROP_REACH) continue;
        if (best === null || distance < best.distance) best = { index: group.index, distance };
    }

    return best?.index ?? null;
}
