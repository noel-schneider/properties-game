import './Scoreboard.css'
import PropertySheet from './PropertySheet'
import { useTranslator } from './i18n'
import type { PropertyRow } from './properties'

interface ScoreboardProps {
    /** Answers got right: a group found, or a concept added to one. */
    finds: number;
    /** Concepts in the whole game with nothing left to find. */
    finished: number;
    /** Every concept in the game, which does not move while the board does. */
    total: number;
    /** Groups that can still be formed from what is on the board. */
    remaining: number;
    /** Every category named so far, finished ones first. */
    properties: PropertyRow[];
}

function Scoreboard({ finds, finished, total, remaining, properties }: ScoreboardProps) {
    const { t } = useTranslator();

    return (
        <div className="scoreboard">
            <p className="scoreboard__item">
                {t('score.found')}{' '}
                <span data-testid="found" className="scoreboard__value">{finds}</span>
            </p>
            <p className="scoreboard__item">
                {t('score.finished')}{' '}
                <span data-testid="finished" className="scoreboard__value">{finished} / {total}</span>
            </p>
            <div className="scoreboard__item">
                <PropertySheet rows={properties} />
            </div>
            <p className="scoreboard__item">
                {t('score.remaining')}{' '}
                <span data-testid="remaining" className="scoreboard__value">{remaining}</span>
            </p>
        </div>
    );
}

export default Scoreboard;
