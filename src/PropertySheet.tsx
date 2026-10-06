import './PropertySheet.css'
import { useTranslator } from './i18n'
import type { PropertyRow } from './properties'

interface Props {
    rows: PropertyRow[];
}

/**
 * What has been named so far, and how much of each is still out there.
 *
 * Open, always. It was a menu that dropped from the scoreboard on a hover,
 * shut by default on the grounds that a list of fifty categories would be the
 * loudest thing over the board — which it would, in the middle of the screen.
 * A tester asked for it open and was right: it is the record of their own
 * work, and the one thing on the board that answers "what have I named?".
 *
 * So it moved rather than merely opening: a narrow column down the left, out
 * of the board's way, quiet enough to be glanced at and never read. Nothing in
 * it can be clicked, because nothing in it does anything.
 */
function PropertySheet({ rows }: Props) {
    const { t, property: propertyName } = useTranslator();

    // Nothing found yet. An empty box in the corner of a board is furniture.
    if (rows.length === 0) return null;

    const done = rows.filter((row) => row.complete).length;

    return (
        <aside className="sheet" aria-label={t('score.properties')}>
            <p className="sheet__heading">
                {t('score.properties')}{' '}
                <span data-testid="properties-done" className="sheet__tally">
                    {done} / {rows.length}
                </span>
            </p>
            <ul className="sheet__list">
                {rows.map((row) => (
                    <li key={row.property} className="sheet__row" data-complete={String(row.complete)}>
                        <span className="sheet__name">{propertyName(row.property)}</span>
                        <span className="sheet__count">{row.have} / {row.total}</span>
                    </li>
                ))}
            </ul>
        </aside>
    );
}

export default PropertySheet;
