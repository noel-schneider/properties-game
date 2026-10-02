import { useState } from 'react';
import Form from "./Form";
import Graph from "./Graph";
import Scoreboard from "./Scoreboard";
import { dealRound, getAllConcepts, propertyAliases } from "./concepts";
import { resolveGuess } from "./round";

export type Feedback = 'none' | 'correct' | 'wrong';

const pool = getAllConcepts();

function App() {

    const [hand, setHand] = useState(dealRound);
    const [selected, setSelected] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<Feedback>('none');
    const [score, setScore] = useState(0);

    const toggleConcept = (name: string) => {
        setFeedback('none');
        setSelected((current) =>
            current.includes(name)
                ? current.filter((n) => n !== name)
                : [...current, name]
        );
    };

    const submitGuess = (guess: string): boolean => {
        const outcome = resolveGuess(hand, selected, guess, { aliases: propertyAliases, pool });

        if (!outcome.correct) {
            setFeedback('wrong');
            return false;
        }

        setScore((current) => current + outcome.points);
        setSelected([]);
        setFeedback('correct');
        // A hand with nothing left to find is a dead board, so the next round
        // is dealt straight away.
        setHand(outcome.hand.solutions.length > 0 ? outcome.hand : dealRound());
        return true;
    };

  return (
      <>
          <Scoreboard score={score} remaining={hand.solutions.length} />
          <Graph concepts={hand.concepts} selected={selected} onToggle={toggleConcept} />
          <Form selected={selected} feedback={feedback} onSubmit={submitGuess} />
      </>
  );
}

export default App;
