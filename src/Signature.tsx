import { useState } from 'react'
import './Signature.css'
import { PORTFOLIO_URL, SUPPORT_URL } from './supporting'
import { useTranslator } from './i18n'

/**
 * How the byline and the offer sit together. On trial — the bench below is
 * dev-only and goes once one of these is chosen.
 */
export type Layout = 'sign-first' | 'give-first' | 'stacked' | 'prose';

/** A literal rather than LAYOUTS[0], so the bench's labels leave the build. */
const DEFAULT_LAYOUT: Layout = 'sign-first';

const LAYOUTS: { id: Layout; label: string }[] = [
    { id: 'sign-first', label: 'Nom puis bouton' },
    { id: 'give-first', label: 'Bouton puis nom' },
    { id: 'stacked', label: 'Empilé' },
    { id: 'prose', label: 'Une phrase' },
];

interface Props {
    layout?: Layout;
}

/**
 * Who made this, and how to thank them. Bottom left, out of the way of the
 * board and of every control, because neither of these is part of playing.
 *
 * Both are links rather than buttons, because that is what they are: they leave
 * for pages somebody else hosts. Nothing about a payment happens in this game
 * and nothing here ever should.
 */
function Signature({ layout = DEFAULT_LAYOUT }: Props) {
    const { t } = useTranslator();
    const [shown, setShown] = useState<Layout>(layout);
    const used = import.meta.env.DEV ? shown : layout;

    // Both links leave for somewhere else. Without noopener the page they open
    // can reach back into this one; noreferrer keeps the game's address out of
    // their logs.
    const away = { target: '_blank', rel: 'noopener noreferrer' } as const;

    const by = (
        <a className="signature__by" href={PORTFOLIO_URL} {...away} aria-label={t('credit.visit')}>
            {t('credit.by')}
        </a>
    );

    // Worded, not a bare cup: a glyph on its own tells a player there is a link,
    // never what it is for.
    const give = (
        <a className="signature__give" href={SUPPORT_URL} {...away}>
            <span className="signature__cup" aria-hidden="true">☕</span>
            {t('support.open')}
        </a>
    );

    return (
        <>
            {used === 'prose' ? (
                // No box at all: one sentence in the corner, two words of it
                // underlined. The lightest thing that can still be clicked.
                <p className={`signature signature--prose`}>
                    {by}
                    <span className="signature__dot" aria-hidden="true">·</span>
                    <a className="signature__plain" href={SUPPORT_URL} {...away}>
                        <span aria-hidden="true">☕ </span>{t('support.open')}
                    </a>
                </p>
            ) : (
                <div className={`signature signature--${used}`}>
                    {used === 'give-first' ? <>{give}{by}</> : <>{by}{give}</>}
                </div>
            )}

            {import.meta.env.DEV && (
                <div className="signature__bench">
                    {LAYOUTS.map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            className={id === used ? 'signature__try signature__try--on' : 'signature__try'}
                            onClick={() => setShown(id)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}

export default Signature;
