import './Summary.css'
import { useTranslator } from './i18n'
import { SUPPORT_URL } from './supporting'

export interface RunStats {
    categories: number;
    boards: number;
    correct: number;
    wrong: number;
    bestStreak: number;
    achievements: number;
    totalAchievements: number;
}

interface SummaryProps {
    stats: RunStats;
    onPlayAgain: () => void;
    onKeepPlaying: () => void;
}

function Figure({ label, value }: { label: string; value: string }) {
    return (
        <div className="summary__figure">
            <span className="summary__value">{value}</span>
            <span className="summary__label">{label}</span>
        </div>
    );
}

function Summary({ stats, onPlayAgain, onKeepPlaying }: SummaryProps) {
    const { t } = useTranslator();

    return (
        <div className="summary" role="dialog" aria-modal="true" aria-label={t('summary.eyebrow')}>
            <div className="summary__card">
                <p className="summary__eyebrow">{t('summary.eyebrow')}</p>
                <h2 className="summary__title">{t('summary.title')}</h2>

                <div className="summary__figures">
                    <Figure label={t('summary.categories')} value={String(stats.categories)} />
                    <Figure label={t('summary.boards')} value={String(stats.boards)} />
                    <Figure label={t('summary.correct')} value={String(stats.correct)} />
                    <Figure label={t('summary.wrong')} value={String(stats.wrong)} />
                    <Figure label={t('summary.bestStreak')} value={String(stats.bestStreak)} />
                    <Figure
                        label={t('summary.achievements')}
                        value={`${stats.achievements} / ${stats.totalAchievements}`}
                    />
                </div>

                {/* After the figures and before the buttons: a thank-you reads as
                    one when the game is over and the player is already pleased. */}
                <p className="summary__support">
                    {t('summary.support')}{' '}
                    <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
                        {t('support.yes')}
                    </a>
                </p>

                <div className="summary__actions">
                    <button type="button" className="summary__button summary__button--primary" onClick={onPlayAgain}>
                        {t('summary.playAgain')}
                    </button>
                    <button type="button" className="summary__button" onClick={onKeepPlaying}>
                        {t('summary.keepPlaying')}
                    </button>
                </div>
                <p className="summary__note">{t('summary.note')}</p>
            </div>
        </div>
    );
}

export default Summary;
