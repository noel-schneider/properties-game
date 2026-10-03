import './Signature.css'
import { PORTFOLIO_URL, SUPPORT_URL } from './supporting'
import { useTranslator } from './i18n'

/**
 * Who made this, and how to thank them. Bottom left, out of the way of the
 * board and of every control, because neither of these is part of playing.
 *
 * Both are links rather than buttons, because that is what they are: they leave
 * for pages somebody else hosts. Nothing about a payment happens in this game
 * and nothing here ever should.
 */
function Signature() {
    const { t } = useTranslator();

    return (
        <div className="signature">
            <a
                className="signature__by"
                href={PORTFOLIO_URL}
                target="_blank"
                // Without noopener the page it opens can reach back into this
                // one; noreferrer keeps the game's address out of their logs.
                rel="noopener noreferrer"
                aria-label={t('credit.visit')}
            >
                {t('credit.by')}
            </a>
            {/* Worded, not a bare cup: a glyph on its own tells a player there
                is a link, never what it is for. */}
            <a
                className="signature__give"
                href={SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
            >
                <span className="signature__cup" aria-hidden="true">☕</span>
                {t('support.open')}
            </a>
        </div>
    );
}

export default Signature;
