import { useTranslator } from './i18n'

interface HintProps {
    /** Whether there is a trio on the board to point at. */
    available: boolean;
    /**
     * Nothing has been found in a while. The button starts shifting its
     * weight — it does not volunteer anything, and pressing it is still the
     * only way to be shown a pair.
     */
    urging?: boolean;
    onAsk: () => void;
}

/**
 * The nudge, asked for rather than given.
 *
 * It used to arrive on its own after forty-five seconds and again every
 * twenty-five after that: two concepts pulsing at a player who had not asked
 * anything, with nothing on screen to say what the two had to do with each
 * other. A tester read it as the game taking them by the hand.
 *
 * Behind a button, the same mark answers a question, which is the whole
 * difference — and a player who never presses it is never nudged at all.
 */
function Hint({ available, urging = false, onAsk }: HintProps) {
    const { t } = useTranslator();

    return (
        <button
            type="button"
            // Never while there is nothing to show: a button that asks to be
            // pressed and then does nothing is worse than a quiet one.
            className={urging && available ? 'control control--urging' : 'control'}
            onClick={onAsk}
            // Nothing can be formed from what is on the board: at that point
            // the only move left is dropping a concept into a group already
            // found, and there is no pair to light.
            disabled={!available}
            aria-label={t('hint.ask')}
            title={t('hint.ask')}
        >
            {t('hint.ask')}
        </button>
    );
}

export default Hint;
