import './Scoreboard.css'
import { useTranslator } from './i18n'

interface ScoreboardProps {
    /** Answers got right: a group found, or a concept added to one. */
    finds: number;
    /** Concepts in the whole game with nothing left to find. */
    finished: number;
    /** Every concept in the game, which does not move while the board does. */
    total: number;
    /** Groups that can still be formed from what is on the board. */
    remaining: number;
}

/**
 * The counts, across the top.
 *
 * The categories named so far used to hang off this as a menu; they have their
 * own column down the left now, open for the whole game, and the count that
 * used to live here went with them rather than being said twice.
 */
function Scoreboard({ finds, finished, total, remaining }: ScoreboardProps) {
    const { t } = useTranslator();

    return (
        <div className="scoreboard">
            <p className="scoreboard__item">
                {t('score.found')}{' '}
                {/*
                  * Keyed on the number itself, so a count that changes
                  * arrives as a new element and can be seen to arrive. A span
                  * edited in place is a number that was one thing and is
                  * now another, with nothing in between.
                  */}
                <span key={finds} data-testid="found" className="scoreboard__value">{finds}</span>
            </p>
            <p className="scoreboard__item">
                {t('score.finished')}{' '}
                <span key={finished} data-testid="finished" className="scoreboard__value">{finished} / {total}</span>
            </p>
            <p className="scoreboard__item">
                {t('score.remaining')}{' '}
                <span key={remaining} data-testid="remaining" className="scoreboard__value">{remaining}</span>
            </p>
        </div>
    );
}

export default Scoreboard;
