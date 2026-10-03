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
            className={playing ? 'control control--icon control--on' : 'control control--icon'}
            onClick={onToggle}
            aria-label={label}
            title={label}
        >
            <span aria-hidden="true">♪</span>
        </button>
    );
}

export default MusicToggle;
