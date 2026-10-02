import { useRef, useState } from 'react';
import Form from "./Form";
import Graph from "./Graph";
import Scoreboard from "./Scoreboard";
import Toast from "./achievements/Toast";
import { emptyProgress, recordEvent } from "./achievements";
import { playUnlockChime } from "./achievements/chime";
import { loadLifetime, saveLifetime } from "./achievements/storage";
import { dealRound, getAllConcepts, propertyAliases } from "./concepts";
import { normalizeAnswer } from "./guess";
import { resolveGuess } from "./round";
import type { Achievement, GameEvent, Progress } from "./achievements";

export type Feedback = 'none' | 'correct' | 'wrong';

const pool = getAllConcepts();

interface AppProps {
    /** Injected so tests can watch the unlock sound without making noise. */
    playChime?: () => void;
}

function App({ playChime = playUnlockChime }: AppProps) {

    const [hand, setHand] = useState(dealRound);
    const [selected, setSelected] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<Feedback>('none');
    const [score, setScore] = useState(0);
    const [announcing, setAnnouncing] = useState<Achievement[]>([]);

    // Progress is not rendered, only read when an event arrives, so it lives in
    // a ref: a state update here would re-render the board for nothing.
    const progress = useRef<Progress>(undefined as unknown as Progress);
    if (progress.current === undefined) {
        progress.current = emptyProgress(loadLifetime());
        progress.current = recordEvent(progress.current, {
            type: 'board-dealt',
            at: Date.now(),
            groups: hand.solutions.length,
        }).progress;
    }

    const record = (event: GameEvent) => {
        const { progress: next, unlocked } = recordEvent(progress.current, event);
        progress.current = next;

        if (unlocked.length === 0) return;

        saveLifetime(next.lifetime);
        setAnnouncing((current) => [...current, ...unlocked]);
        playChime();
    };

    const dismissAnnouncement = (id: string) => {
        setAnnouncing((current) => current.filter((achievement) => achievement.id !== id));
    };

    const toggleConcept = (name: string) => {
        setFeedback('none');
        setSelected((current) =>
            current.includes(name)
                ? current.filter((n) => n !== name)
                : [...current, name]
        );
        record({ type: 'concept-toggled', name });
    };

    const submitGuess = (guess: string): boolean => {
        const outcome = resolveGuess(hand, selected, guess, { aliases: propertyAliases, pool });

        record({
            type: 'guess',
            at: Date.now(),
            correct: outcome.correct,
            property: outcome.property,
            exactName:
                outcome.property !== undefined &&
                normalizeAnswer(guess) === normalizeAnswer(outcome.property),
            selection: selected,
        });

        if (!outcome.correct) {
            setFeedback('wrong');
            return false;
        }

        setScore((current) => current + outcome.points);
        setSelected([]);
        setFeedback('correct');

        // A hand with nothing left to find is a dead board, so the next round
        // is dealt straight away.
        const next = outcome.hand.solutions.length > 0 ? outcome.hand : dealRound();
        setHand(next);
        if (next !== outcome.hand) {
            record({ type: 'board-dealt', at: Date.now(), groups: next.solutions.length });
        }
        return true;
    };

  return (
      <>
          <Scoreboard score={score} remaining={hand.solutions.length} />
          <Graph concepts={hand.concepts} selected={selected} onToggle={toggleConcept} />
          <Form selected={selected} feedback={feedback} onSubmit={submitGuess} />
          <Toast unlocked={announcing} onDismiss={dismissAnnouncement} />
      </>
  );
}

export default App;
