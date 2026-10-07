import { useEffect, useState } from 'react'
import './DevPanel.css'
import type { ReactNode } from 'react'

/** The class the panel hangs on the body, so the board can make room for it. */
export const OPEN_CLASS = 'dev-panel-open';

/**
 * Whether the panel starts open. Open unless something has said otherwise,
 * which is how the end-to-end suite gets the game without a strip of tools
 * down the side of it: the panel lies over the left edge of the board, and a
 * test clicking there is clicking on the tools.
 */
export const OPEN_KEY = 'properties-game:dev-panel';

function startsOpen(): boolean {
    try {
        return localStorage.getItem(OPEN_KEY) !== 'false';
    } catch {
        return true;
    }
}

interface Props {
    children: ReactNode;
}

/**
 * Dev only: every tool in one column down the left.
 *
 * They used to be scattered — the answers over one corner of the board, the
 * board's own bench and the orchestra stacked in another, each one fixed to
 * its own spot and each one covering something. Together they take one strip
 * of the window, and what they cover is one strip rather than four.
 *
 * It folds away, because the thing most worth looking at while building this
 * game is the game with none of this on top of it.
 *
 * The whole file goes when the game ships; `import.meta.env.DEV` in App is
 * what keeps it out of a built bundle, import and all.
 */
function DevPanel({ children }: Props) {
    const [open, setOpen] = useState(startsOpen);

    // The categories column lives down the same edge, and would spend the
    // whole of development underneath this.
    useEffect(() => {
        document.body.classList.toggle(OPEN_CLASS, open);
        try {
            localStorage.setItem(OPEN_KEY, String(open));
        } catch {
            // A dev preference is not worth a crash.
        }
        return () => document.body.classList.remove(OPEN_CLASS);
    }, [open]);

    return (
        <div className={open ? 'dev' : 'dev dev--shut'} data-testid="dev-panel">
            <button
                type="button"
                className="dev__fold"
                onClick={() => setOpen((shown) => !shown)}
                aria-expanded={open}
                aria-label={open ? 'Replier les outils' : 'Déplier les outils'}
            >
                <span aria-hidden="true">{open ? '‹' : '›'}</span>
                {open && <span className="dev__title">dev</span>}
            </button>

            {open && <div className="dev__body">{children}</div>}
        </div>
    );
}

export default DevPanel;
