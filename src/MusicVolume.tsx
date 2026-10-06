import './MusicVolume.css'
import { useTranslator } from './i18n'

interface MusicVolumeProps {
    /** Where it is set, as a fraction of full. */
    level: number;
    /** Whether the bed is running at all. */
    playing: boolean;
    onChange: (level: number) => void;
}

/**
 * How loud the bed is, beside the switch that starts it.
 *
 * Out in the open rather than behind a hover: a player who wants the music
 * quieter rather than gone has no way of guessing that a slider exists, and
 * the thing they reach for instead is the off switch.
 *
 * Disabled while the music is off, for the same reason the sheet of categories
 * is disabled before anything has been found — a control that sets nothing
 * should not invite a hand.
 */
function MusicVolume({ level, playing, onChange }: MusicVolumeProps) {
    const { t } = useTranslator();

    return (
        <input
            className="volume"
            type="range"
            min={0}
            max={100}
            // Fine enough to find a level, coarse enough that a slider an inch
            // wide does not need a steady hand.
            step={5}
            value={Math.round(level * 100)}
            disabled={!playing}
            aria-label={t('music.volume')}
            title={t('music.volume')}
            onChange={(event) => onChange(Number(event.target.value) / 100)}
        />
    );
}

export default MusicVolume;
