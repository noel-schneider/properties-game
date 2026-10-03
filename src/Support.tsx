import './Support.css'
import { SUPPORT_URL } from './supporting'
import { useTranslator } from './i18n'

interface InviteProps {
    onDismiss: () => void;
}

/**
 * The one time the game brings it up itself.
 *
 * A note along the bottom, not a door across the middle: it never takes the
 * board, never takes the keyboard, and a player who ignores it carries on
 * answering. It is said once in a player's life — a whole game runs to a
 * hundred and fourteen answers, and anything said on a count would be said
 * again and again inside one evening.
 */
export function SupportInvite({ onDismiss }: InviteProps) {
    const { t } = useTranslator();

    return (
        <div className="support" role="status">
            <span className="support__words">{t('support.invite')}</span>
            <a
                className="support__yes"
                href={SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onDismiss}
            >
                {t('support.yes')}
            </a>
            <button type="button" className="support__no" onClick={onDismiss}>
                {t('support.no')}
            </button>
        </div>
    );
}
