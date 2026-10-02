import { useRef, useState } from 'react';
import Form from "./Form";
import Graph from "./Graph";
import Scoreboard from "./Scoreboard";
import Panel from "./achievements/Panel";
import Toast from "./achievements/Toast";
import { emptyProgress, recordEvent } from "./achievements";
import { playUnlockChime } from "./achievements/chime";
import { loadLifetime, loadMuted, saveLifetime, saveMuted } from "./achievements/storage";
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

    // Progress is read when an event arrives rather than rendered, so it lives
    // in a ref: a state update per toggle would re-render the board for
    // nothing. Only the earned ids, which the panel shows, are state.
    const progress = useRef<Progress | null>(null);
    if (progress.current === null) {
        progress.current = recordEvent(emptyProgress(loadLifetime()), {
            type: 'board-dealt',
            at: Date.now(),
            groups: hand.solutions.length,
        }).progress;
    }

    const [unlocked, setUnlocked] = useState<string[]>(() => progress.current!.lifetime.unlocked);
    const [muted, setMuted] = useState(loadMuted);

    const toggleMute = () => {
        setMuted((current) => {
            saveMuted(!current);
            return !current;
        });
    };

    const record = (event: GameEvent) => {
        const { progress: next, unlocked: earned } = recordEvent(progress.current!, event);
        progress.current = next;

        if (earned.length === 0) return;

        saveLifetime(next.lifetime);
        setUnlocked(next.lifetime.unlocked);
        setAnnouncing((current) => [...current, ...earned]);
        if (!muted) playChime();
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
          <Panel unlocked={unlocked} muted={muted} onToggleMute={toggleMute} />
          <Graph concepts={hand.concepts} selected={selected} onToggle={toggleConcept} />
          <Form selected={selected} feedback={feedback} onSubmit={submitGuess} />
          <Toast unlocked={announcing} onDismiss={dismissAnnouncement} />
      </>
  );
}

export default App;
