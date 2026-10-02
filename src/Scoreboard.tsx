import './Scoreboard.css'

interface ScoreboardProps {
    score: number;
    remaining: number;
}

function Scoreboard({ score, remaining }: ScoreboardProps) {
    return (
        <div className="scoreboard">
            <p className="scoreboard__item">
                Found <span data-testid="score" className="scoreboard__value">{score}</span>
            </p>
            <p className="scoreboard__item">
                Left in this board <span className="scoreboard__value">{remaining}</span>
            </p>
        </div>
    );
}

export default Scoreboard;
