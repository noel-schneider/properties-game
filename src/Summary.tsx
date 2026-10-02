import './Summary.css'

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
    return (
        <div className="summary" role="dialog" aria-modal="true" aria-label="Run complete">
            <div className="summary__card">
                <p className="summary__eyebrow">Run complete</p>
                <h2 className="summary__title">You found every category.</h2>

                <div className="summary__figures">
                    <Figure label="categories" value={String(stats.categories)} />
                    <Figure label="boards" value={String(stats.boards)} />
                    <Figure label="correct" value={String(stats.correct)} />
                    <Figure label="wrong" value={String(stats.wrong)} />
                    <Figure label="best streak" value={String(stats.bestStreak)} />
                    <Figure
                        label="achievements"
                        value={`${stats.achievements} / ${stats.totalAchievements}`}
                    />
                </div>

                <div className="summary__actions">
                    <button type="button" className="summary__button summary__button--primary" onClick={onPlayAgain}>
                        Play again
                    </button>
                    <button type="button" className="summary__button" onClick={onKeepPlaying}>
                        Keep playing
                    </button>
                </div>
                <p className="summary__note">Playing again clears the categories. Your achievements stay.</p>
            </div>
        </div>
    );
}

export default Summary;
