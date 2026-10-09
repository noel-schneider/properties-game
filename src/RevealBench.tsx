import { REVEALS } from './reveal'
import type { Reveal } from './reveal'
import './RevealBench.css'

interface Props {
    reveal: Reveal;
    onPick: (reveal: Reveal) => void;
}

/**
 * How a reveal draws itself, switched on the spot. Dev only — the four ways
 * of saying "this word is about those three bubbles" only differ on a board
 * with a dozen bubbles and a few categories found, which is nowhere a
 * screenshot can reach.
 */
function RevealBench({ reveal, onPick }: Props) {
    return (
        <div className="reveal-bench">
            <span className="reveal-bench__label">Reveal</span>
            {REVEALS.map((option) => (
                <button
                    key={option}
                    type="button"
                    className={option === reveal ? 'reveal-bench__try reveal-bench__try--on' : 'reveal-bench__try'}
                    aria-pressed={option === reveal}
                    onClick={() => onPick(option)}
                >
                    {option}
                </button>
            ))}
        </div>
    );
}

export default RevealBench;
