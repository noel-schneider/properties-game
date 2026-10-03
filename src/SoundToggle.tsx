import { useTranslator } from './i18n'

interface SoundToggleProps {
    muted: boolean;
    onToggle: () => void;
}

/**
 * The sound effects, on and off.
 *
 * The glyph does not change and the button is struck through when off, which
 * is exactly what the music button does beside it. They used to disagree —
 * this one swapped its picture, that one grew a border — and two switches for
 * two kinds of sound that behave differently is two things to learn instead of
 * one.
 */
function SoundToggle({ muted, onToggle }: SoundToggleProps) {
    const { t } = useTranslator();
    const label = muted ? t('panel.unmute') : t('panel.mute');

    return (
        <button
            type="button"
            className={muted ? 'control control--icon control--off' : 'control control--icon'}
            onClick={onToggle}
            aria-label={label}
            title={label}
            aria-pressed={!muted}
        >
            {/* Drawn rather than an emoji: every other glyph in this row is a
                line of text in one colour, and a full-colour picture among
                them was the thing that broke the row's look. */}
            <svg className="control__glyph" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 6 h2.4 L9 3 v10 L5.4 10 H3 Z" />
                <path className="control__wave" d="M11.3 5.6 a3.4 3.4 0 0 1 0 4.8" />
                <path className="control__wave" d="M13.2 3.7 a6 6 0 0 1 0 8.6" />
            </svg>
        </button>
    );
}

export default SoundToggle;
