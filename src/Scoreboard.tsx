import './Scoreboard.css'
import { useTranslator } from './i18n'

interface ScoreboardProps {
    /** Groups found. */
    found: number;
    /** Concepts on the board with nothing left to find. */
    finished: number;
    onBoard: number;
    /** Groups that can still be formed from what is on the board. */
    remaining: number;
}

function Scoreboard({ found, finished, onBoard, remaining }: ScoreboardProps) {
    const { t } = useTranslator();

    return (
        <div className="scoreboard">
            <p className="scoreboard__item">
                {t('score.found')}{' '}
                <span data-testid="found" className="scoreboard__value">{found}</span>
            </p>
            <p className="scoreboard__item">
                {t('score.finished')}{' '}
                <span data-testid="finished" className="scoreboard__value">{finished} / {onBoard}</span>
            </p>
            <p className="scoreboard__item">
                {t('score.remaining')}{' '}
                <span data-testid="remaining" className="scoreboard__value">{remaining}</span>
            </p>
        </div>
    );
}

export default Scoreboard;
