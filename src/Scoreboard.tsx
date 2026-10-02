import './Scoreboard.css'
import { useTranslator } from './i18n'

interface ScoreboardProps {
    found: number;
    total: number;
    remaining: number;
}

function Scoreboard({ found, total, remaining }: ScoreboardProps) {
    const { t } = useTranslator();

    return (
        <div className="scoreboard">
            <p className="scoreboard__item">
                {t('score.categories')}{' '}
                <span data-testid="categories" className="scoreboard__value">{found} / {total}</span>
            </p>
            <p className="scoreboard__item">
                {t('score.remaining')} <span className="scoreboard__value">{remaining}</span>
            </p>
        </div>
    );
}

export default Scoreboard;
