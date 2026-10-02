import './Scoreboard.css'

interface ScoreboardProps {
    found: number;
    total: number;
    remaining: number;
}

function Scoreboard({ found, total, remaining }: ScoreboardProps) {
    return (
        <div className="scoreboard">
            <p className="scoreboard__item">
                Categories{' '}
                <span data-testid="categories" className="scoreboard__value">{found} / {total}</span>
            </p>
            <p className="scoreboard__item">
                Left in this board <span className="scoreboard__value">{remaining}</span>
            </p>
        </div>
    );
}

export default Scoreboard;
