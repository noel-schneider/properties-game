import { useTranslator } from './i18n'
import type { CSSProperties } from 'react'
import type { Hand } from './hand'

interface AnswersProps {
    hand: Hand;
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
const styles: Record<string, CSSProperties> = {
    panel: {
        position: 'fixed',
        top: '1.25rem',
        left: '1.25rem',
        zIndex: 9000,
        maxWidth: '17rem',
        padding: '0.6rem 0.75rem',
        borderRadius: '0.6rem',
        border: '1px dashed #5a5a7d',
        background: 'rgba(31, 33, 53, 0.85)',
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
function Answers({ hand, enabled }: AnswersProps) {
    const { concept, property } = useTranslator();

    if (!enabled) return null;

    const groups = [
        ...hand.solved.map((group) => ({ ...group, found: true })),
        ...hand.solutions.map((group) => ({ ...group, found: false })),
    ];

    return (
        <div style={styles.panel} data-testid="answers">
            <p style={styles.title}>answers (dev only)</p>
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
