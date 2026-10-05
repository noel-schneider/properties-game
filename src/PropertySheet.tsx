import { useEffect, useRef, useState } from 'react'
import './PropertySheet.css'
import { useTranslator } from './i18n'
import type { PropertyRow } from './properties'

interface Props {
    rows: PropertyRow[];
}

/**
 * What has been named so far, and how much of each is still out there.
 *
 * Shut by default. A game runs to fifty categories and a list of fifty above
 * the board would be the board's loudest thing, which it has no business
 * being — the player's work is underneath it.
 */
function PropertySheet({ rows }: Props) {
    const { t, property: propertyName } = useTranslator();
    const [open, setOpen] = useState(false);
    const box = useRef<HTMLDivElement>(null);
    const done = rows.filter((row) => row.complete).length;

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        // A finger never leaves, so a pointer rule alone would strand this open
        // over the board.
        const onDown = (event: PointerEvent) => {
            if (!box.current?.contains(event.target as Node)) setOpen(false);
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('pointerdown', onDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('pointerdown', onDown);
        };
    }, [open]);

    return (
        <div
            className="sheet"
            ref={box}
            onPointerEnter={() => rows.length > 0 && setOpen(true)}
            onPointerLeave={(event) => {
                // Only when the pointer has gone somewhere else on the page; a
                // leave with nothing on the other side of it means it left the
                // window, which is no reason to shut a menu.
                const to = event.relatedTarget as Node | null;
                if (to instanceof Node && !box.current?.contains(to)) setOpen(false);
            }}
        >
            <button
                type="button"
                className={open ? 'sheet__button sheet__button--on' : 'sheet__button'}
                onClick={() => setOpen(true)}
                onFocus={() => rows.length > 0 && setOpen(true)}
                disabled={rows.length === 0}
                aria-expanded={open}
            >
                {t('score.properties')}{' '}
                <span data-testid="properties-done" className="scoreboard__value">
                    {done} / {rows.length}
                </span>
                <span className="sheet__arrow" aria-hidden="true">{open ? '▴' : '▾'}</span>
            </button>

            {open && (
                // Flush against the button it drops from, the gap made of its
                // own padding: a real gap is a strip of nothing the pointer
                // crosses on the way down, and crossing it shuts the list under
                // the hand reaching for it.
                <div className="sheet__drop">
                <ul className="sheet__list">
                    {rows.map((row) => (
                        <li key={row.property} className="sheet__row" data-complete={String(row.complete)}>
                            <span className="sheet__name">{propertyName(row.property)}</span>
                            <span className="sheet__count">{row.have} / {row.total}</span>
                        </li>
                    ))}
                </ul>
                </div>
            )}
        </div>
    );
}

export default PropertySheet;
