import { useMemo, useState } from 'react';
import Form from "./Form";
import Graph from "./Graph";
import { dealRound, propertyAliases } from "./concepts";
import { checkGuess } from "./guess";

export type Feedback = 'none' | 'correct' | 'wrong';

function App() {

    const hand = useMemo(() => dealRound(), []);
    const [selected, setSelected] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<Feedback>('none');

    const toggleConcept = (name: string) => {
        setFeedback('none');
        setSelected((current) =>
            current.includes(name)
                ? current.filter((n) => n !== name)
                : [...current, name]
        );
    };

    const submitGuess = (guess: string) => {
        const concepts = hand.concepts.filter((c) => selected.includes(c.name));
        setFeedback(checkGuess(concepts, guess, propertyAliases) ? 'correct' : 'wrong');
    };

  return (
      <>
          <Graph concepts={hand.concepts} selected={selected} onToggle={toggleConcept} />
          <Form selected={selected} feedback={feedback} onSubmit={submitGuess} />
      </>
  );
}

export default App;
