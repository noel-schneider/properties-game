import { useTranslator } from './i18n'

interface MusicToggleProps {
    playing: boolean;
    onToggle: () => void;
}

/**
 * The bed, on and off. Separate from the sound toggle beside it: wanting the
 * chime that answers a right guess and wanting an hour of music underneath are
 * different wants, and one switch for both would make a player pick.
 */
function MusicToggle({ playing, onToggle }: MusicToggleProps) {
    const { t } = useTranslator();
    const label = playing ? t('music.stop') : t('music.play');

    return (
        <button
            type="button"
            className={playing ? 'control control--icon' : 'control control--icon control--off'}
            onClick={onToggle}
            aria-label={label}
            title={label}
            aria-pressed={playing}
        >
            <svg className="control__glyph" viewBox="0 0 16 16" aria-hidden="true">
                <path className="control__wave" d="M6 11.5 V3.4 L13 2 v8.1" />
                <circle cx="4.2" cy="11.8" r="1.9" />
                <circle cx="11.2" cy="10.4" r="1.9" />
            </svg>
        </button>
    );
}

export default MusicToggle;
