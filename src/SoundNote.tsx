import { useEffect, useState } from 'react'
import './SoundNote.css'
import { useTranslator } from './i18n'

/** How long it stays. Long enough to read twice, short enough to forgive. */
export const NOTE_SECONDS = 6;

interface Props {
    muted: boolean;
}

/**
 * A word on the way in: the game has sound, and it is better with it.
 *
 * Said once per arrival and never again in that sitting, with no dialog, no
 * focus and no keyboard taken — a player who never looks at it loses nothing.
 * It leaves by itself after a few seconds.
 *
 * Nothing is said to somebody who has muted the game: they answered this
 * question already, and asking again is nagging.
 */
function SoundNote({ muted }: Props) {
    const { t } = useTranslator();
    const [shown, setShown] = useState(!muted);

    useEffect(() => {
        if (!shown) return;
        const timer = setTimeout(() => setShown(false), NOTE_SECONDS * 1000);
        return () => clearTimeout(timer);
    }, [shown]);

    if (!shown) return null;

    return (
        // Announced politely, but not role="status": the board already has one
        // status region — the line under the input that answers a guess — and a
        // second would make "the game's reply" ambiguous to a screen reader and
        // to anything else looking for it.
        <div className="sound-note" data-testid="sound-note" aria-live="polite">
            <span className="sound-note__cue" aria-hidden="true">🔊</span>
            <span className="sound-note__words">{t('sound.better')}</span>
            <button
                type="button"
                className="sound-note__close"
                aria-label={t('sound.dismiss')}
                onClick={() => setShown(false)}
            >
                ×
            </button>
        </div>
    );
}

export default SoundNote;
