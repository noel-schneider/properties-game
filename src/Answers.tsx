import { useTranslator } from './i18n'
import type { CSSProperties } from 'react'
import { openProperties } from './game'
import type { Solution } from './hand'
import type { Concept } from './types'

interface AnswersProps {
    board: string[];
    pool: Concept[];
    found: Solution[];
    /**
     * Whether to show anything. App gates the whole component behind
     * import.meta.env.DEV so a built game drops it, import and all: this gives
     * away every answer on the board and must never reach a real player.
     */
    enabled: boolean;
}

// Styles live here rather than in a stylesheet. A CSS import is a side effect
// that survives tree-shaking, so a built game would carry the rules for a panel
// it never renders. This way the whole thing is one file to delete.
//
// It sat fixed over a corner of the board until every dev tool was gathered
// into one column; in there it is simply a block among the others.
const styles: Record<string, CSSProperties> = {
    panel: {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '0.72rem',
        color: '#9a9ab0',
    },
    title: {
        margin: '0 0 0.4rem',
        fontSize: '0.62rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#6f6f8a',
    },
    list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' },
    group: { display: 'flex', flexDirection: 'column' },
    found: { opacity: 0.4, textDecoration: 'line-through' },
    property: { color: '#ffad69', fontWeight: 600 },
    concepts: { color: '#8a8aa3' },
};

/** Temporary: shows the board's answers while the game is being worked on. */
function Answers({ board, pool, found, enabled }: AnswersProps) {
    const { concept, property } = useTranslator();

    if (!enabled) return null;

    const byName = new Map(pool.map((c) => [c.name, c]));
    const open = new Map<string, string[]>();
    for (const name of board) {
        const concept = byName.get(name);
        if (!concept) continue;
        for (const property of openProperties(concept, found)) {
            open.set(property, [...(open.get(property) ?? []), name]);
        }
    }

    const groups = [...open.entries()]
        .filter(([, names]) => names.length >= 3)
        .map(([property, names]) => ({ property, concepts: names.slice(0, 3), found: false }));

    return (
        <div className="answers" style={styles.panel} data-testid="answers">
            <p className="answers__title" style={styles.title}>answers (dev only)</p>
            <ul style={styles.list}>
                {groups.map((group) => (
                    <li
                        key={group.property}
                        style={group.found ? { ...styles.group, ...styles.found } : styles.group}
                        data-testid={`answer-${group.property}`}
                        data-found={String(group.found)}
                    >
                        <span style={styles.property}>{property(group.property)}</span>
                        <span style={styles.concepts}>{group.concepts.map(concept).join(' · ')}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Answers;
