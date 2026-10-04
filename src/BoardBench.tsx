import './BoardBench.css'

interface Props {
    /** How many concepts on the board have nothing left to find. */
    finished: number;
    /** Takes every one of them off at once. */
    onSweep: () => void;
    /** Puts back whatever the last sweep took. */
    onRestore: () => void;
    /** Whether there is anything to put back. */
    swept: number;
}

/**
 * Dev only: the board stripped of its finished concepts in one go.
 *
 * A game trims the oldest of them a few at a time, somewhere in its second
 * half, which is far too slow and too late to look at while deciding whether
 * it should trim harder. This does the whole lot on a click.
 */
function BoardBench({ finished, onSweep, onRestore, swept }: Props) {
    return (
        <div className="board-bench">
            <span className="board-bench__label">Plateau</span>
            <button
                type="button"
                className="board-bench__try"
                disabled={finished === 0}
                onClick={onSweep}
            >
                Retirer les {finished} terminés
            </button>
            <button
                type="button"
                className="board-bench__try"
                disabled={swept === 0}
                onClick={onRestore}
            >
                Remettre ({swept})
            </button>
        </div>
    );
}

export default BoardBench;
