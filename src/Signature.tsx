import './Signature.css'
import { PORTFOLIO_URL, SUPPORT_URL } from './supporting'
import { useTranslator } from './i18n'

/**
 * Who made this, and how to thank them. Bottom left, out of the way of the
 * board and of every control, because neither of these is part of playing.
 *
 * One line of small text, no box: the lightest thing a corner can hold and
 * still be clicked. Both are links rather than buttons, because that is what
 * they are — they leave for pages somebody else hosts. Nothing about a payment
 * happens in this game and nothing here ever should.
 */
function Signature() {
    const { t } = useTranslator();

    // Without noopener the page they open can reach back into this one;
    // noreferrer keeps the game's address out of their logs.
    const away = { target: '_blank', rel: 'noopener noreferrer' } as const;

    return (
        <p className="signature">
            <a className="signature__by" href={PORTFOLIO_URL} {...away} aria-label={t('credit.visit')}>
                {t('credit.by')}
            </a>
            <span className="signature__dot" aria-hidden="true">·</span>
            {/* Worded, not a bare cup: a glyph on its own tells a player there
                is a link, never what it is for. */}
            <a className="signature__give" href={SUPPORT_URL} {...away}>
                <span aria-hidden="true">☕ </span>{t('support.open')}
            </a>
        </p>
    );
}

export default Signature;
