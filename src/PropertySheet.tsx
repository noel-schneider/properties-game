import { useEffect, useState } from 'react'
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
    const done = rows.filter((row) => row.complete).length;

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open]);

    return (
        <div className="sheet">
            <button
                type="button"
                className={open ? 'sheet__button sheet__button--on' : 'sheet__button'}
                onClick={() => setOpen((shown) => !shown)}
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
                <ul className="sheet__list">
                    {rows.map((row) => (
                        <li key={row.property} className="sheet__row" data-complete={String(row.complete)}>
                            <span className="sheet__name">{propertyName(row.property)}</span>
                            <span className="sheet__count">{row.have} / {row.total}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default PropertySheet;
