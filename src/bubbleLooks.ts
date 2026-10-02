/**
 * The looks the bubbles can wear, while we pick one.
 *
 * Temporary. The picker that offers these is dev-only and the losers get
 * deleted — this file exists so the choice is made by looking at them side by
 * side rather than by rebuilding the stylesheet four times.
 *
 * They all share a heavier contour, which is the part already decided.
 */
export interface Look {
    id: string;
    /** What it is, for the dev picker's button. */
    label: string;
}

export const LOOKS: Look[] = [
    { id: 'outline', label: 'Contour seul' },
    { id: 'drop', label: 'Ombre portée' },
    { id: 'bead', label: 'Relief bombé' },
    { id: 'glow', label: 'Halo chaud' },
];

/**
 * A literal, not LOOKS[0].id. Graph imports this, and a reference into the
 * array would keep the array — and its dev-only French labels — alive through
 * tree-shaking and into the built game. A test holds the two in step.
 */
export const DEFAULT_LOOK = 'outline';
