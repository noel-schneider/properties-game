import { LAYERS } from './ambient'
import './MusicBench.css'

interface Props {
    /** Null hands the orchestra back to the game's own count. */
    forced: number | null;
    onPick: (count: number | null) => void;
}

/**
 * The orchestra, forced. Dev only — a game adds an instrument every twenty
 * concepts, which is far too long to wait on to hear whether the fourth one
 * belongs in the piece at all.
 */
function MusicBench({ forced, onPick }: Props) {
    return (
        <div className="music-bench">
            <span className="music-bench__label">Orchestre</span>
            {LAYERS.map((layer, i) => (
                <button
                    key={layer.id}
                    type="button"
                    className={forced === i + 1 ? 'music-bench__try music-bench__try--on' : 'music-bench__try'}
                    onClick={() => onPick(i + 1)}
                >
                    {i + 1} · {layer.id}
                </button>
            ))}
            <button
                type="button"
                className={forced === null ? 'music-bench__try music-bench__try--on' : 'music-bench__try'}
                onClick={() => onPick(null)}
            >
                jeu
            </button>
        </div>
    );
}

export default MusicBench;
