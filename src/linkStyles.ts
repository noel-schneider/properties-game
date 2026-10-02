/**
 * Ways of showing that three concepts were found together, while we pick one.
 *
 * Temporary. The picker that offers these is dev-only and the losers get
 * deleted.
 */
export interface LinkStyle {
    id: string;
    /** What it is, for the dev picker's button. */
    label: string;
}

export const LINKS: LinkStyle[] = [
    { id: 'thread', label: 'Fil fin (actuel)' },
    { id: 'ribbon', label: 'Ruban épais' },
    { id: 'blob', label: 'Membrane' },
    { id: 'edges', label: 'Arêtes franches' },
];

/**
 * A literal, not LINKS[0].id. Graph imports this, and a reference into the
 * array would keep the array — and its dev-only French labels — alive through
 * tree-shaking and into the built game. A test holds the two in step.
 */
export const DEFAULT_LINK = 'thread';
