import { useTranslator } from './i18n'

interface SoundToggleProps {
    muted: boolean;
    onToggle: () => void;
}

/** Silences the achievement chime. Lives with the other board controls. */
function SoundToggle({ muted, onToggle }: SoundToggleProps) {
    const { t } = useTranslator();
    const label = muted ? t('panel.unmute') : t('panel.mute');

    return (
        <button
            type="button"
            className="control control--icon"
            onClick={onToggle}
            aria-label={label}
            title={label}
        >
            {muted ? '🔇' : '🔊'}
        </button>
    );
}

export default SoundToggle;
