/**
 * Ways of showing how many properties a concept still has to find, while we
 * pick one.
 *
 * Temporary. The picker that offers these is dev-only and the losers get
 * deleted.
 *
 * All three count what is still *reachable* rather than merely unfound: a
 * count of open properties overstates what can be had fourteen percent of the
 * time, and a number the player cannot act on is worse than no number.
 */
export interface CountLook {
    id: string;
    label: string;
}

export const COUNT_LOOKS: CountLook[] = [
    { id: 'none', label: 'Rien (actuel)' },
    { id: 'pips', label: 'Pastilles' },
    { id: 'gauge', label: 'Jauge sur le bord' },
    { id: 'number', label: 'Chiffre' },
];

/**
 * A literal, not COUNT_LOOKS[0].id. Graph imports this, and a reference into
 * the array would keep the array — and its dev-only French labels — alive
 * through tree-shaking and into the built game. A test holds the two in step.
 */
export const DEFAULT_COUNT_LOOK = 'none';
