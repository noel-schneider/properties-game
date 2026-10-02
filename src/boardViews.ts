/**
 * Ways of showing which concepts share a category, while we pick one.
 *
 * Temporary. The picker that offers these is dev-only and the losers get
 * deleted — this exists so the three can be compared on a real board rather
 * than argued about.
 *
 * The problem they answer: a concept belongs to two to five categories, and
 * the game has fifty-seven, so a fill colour cannot carry the answer. It is
 * one channel per node where the membership is many, and categorical hue runs
 * out around a dozen either way.
 */
export interface BoardView {
    id: string;
    /** What it is, for the dev picker's button. */
    label: string;
}

export const VIEWS: BoardView[] = [
    { id: 'plain', label: 'Rien (actuel)' },
    { id: 'hub', label: 'Moyeu de groupe' },
    { id: 'hover', label: 'Révélation au survol' },
    { id: 'ring', label: 'Couronne segmentée' },
];

/**
 * A literal, not VIEWS[0].id. Graph imports this, and a reference into the
 * array would keep the array — and its dev-only French labels — alive through
 * tree-shaking and into the built game. A test holds the two in step.
 */
export const DEFAULT_VIEW = 'plain';

/**
 * A stable hue for a category name.
 *
 * Only ever used to tell two categories apart where a handful are on screen
 * at once. It is not an identity: fifty-seven categories cannot have
 * fifty-seven legible hues, and nothing here pretends otherwise.
 */
export function hueOf(category: string): number {
    let hash = 0;
    for (const character of category) {
        hash = (hash * 31 + character.charCodeAt(0)) | 0;
    }
    return Math.abs(hash) % 360;
}
