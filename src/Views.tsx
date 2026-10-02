import type { CSSProperties } from 'react'
import { VIEWS } from './boardViews'

interface ViewsProps {
    chosen: string;
    onChoose: (id: string) => void;
    /**
     * Whether to show anything. App gates the whole component behind
     * import.meta.env.DEV so a built game drops it, import and all: this is a
     * bench for picking a way of showing shared categories, not a setting.
     */
    enabled: boolean;
}

// Styles live here rather than in a stylesheet. A CSS import is a side effect
// that survives tree-shaking, so a built game would carry the rules for a
// picker it never renders. This way the whole thing is one file to delete.
const styles: Record<string, CSSProperties> = {
    bench: {
        position: 'fixed',
        left: '1.25rem',
        bottom: '1.25rem',
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
        padding: '0.6rem',
        borderRadius: '0.6rem',
        border: '1px dashed #5a5a7d',
        background: 'rgba(28, 30, 48, 0.86)',
        fontFamily: "'Poppins', system-ui, sans-serif",
    },
    title: {
        margin: 0,
        color: '#8f8aa6',
        fontSize: '0.62rem',
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
    },
    option: {
        appearance: 'none',
        padding: '0.32rem 0.6rem',
        borderRadius: '0.4rem',
        border: '1px solid #40405c',
        background: '#272a40',
        color: '#c9c9db',
        font: 'inherit',
        fontSize: '0.78rem',
        textAlign: 'left',
        cursor: 'pointer',
    },
    chosen: { borderColor: '#ffad69', color: '#ffad69' },
};

function Views({ chosen, onChoose, enabled }: ViewsProps) {
    if (!enabled) return null;

    return (
        <div style={styles.bench}>
            <p style={styles.title}>Catégories (dev only)</p>
            {VIEWS.map((view) => (
                <button
                    key={view.id}
                    type="button"
                    style={view.id === chosen ? { ...styles.option, ...styles.chosen } : styles.option}
                    onClick={() => onChoose(view.id)}
                    aria-pressed={view.id === chosen}
                >
                    {view.label}
                </button>
            ))}
        </div>
    );
}

export default Views;
