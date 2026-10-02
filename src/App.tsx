import { useRef, useState } from 'react';
import "./App.css";
import Answers from "./Answers";
import Form from "./Form";
import Graph from "./Graph";
import Scoreboard from "./Scoreboard";
import Summary from "./Summary";
import LanguageToggle from "./LanguageToggle";
import Panel from "./achievements/Panel";
import Toast from "./achievements/Toast";
import { emptyLifetime, emptyProgress, recordEvent } from "./achievements";
import { playUnlockChime } from "./achievements/chime";
import {
    emptyRunStats, loadFound, loadLifetime, loadMuted, loadRunStats,
    saveFound, saveLifetime, saveMuted, saveRunStats,
} from "./achievements/storage";
import type { RunTally } from "./achievements/storage";
import { CATALOGUE } from "./achievements";
import { formableGroups, openingBoard, refill } from "./board";
import { getAllConcepts } from "./concepts";
import { isFinished, isSpent } from "./game";
import { isExactLabel } from "./guess";
import { resolveGuess } from "./round";
import { useTranslator } from "./i18n";
import type { Achievement, GameEvent, Progress } from "./achievements";
import type { Solution } from "./hand";

export type Feedback = 'none' | 'correct' | 'wrong';

/** How many concepts with something left to find are kept on the board. */
export const ACTIVE_CONCEPTS = 15;

const pool = getAllConcepts();
const byName = new Map(pool.map((concept) => [concept.name, concept]));

interface AppProps {
    /** Injected so tests can watch the unlock sound without making noise. */
    playChime?: () => void;
}

function App({ playChime = playUnlockChime }: AppProps) {

    const { wordings } = useTranslator();
    const [lifetimeAtStart] = useState(loadLifetime);
    const [found, setFound] = useState<Solution[]>(loadFound);

    // The board is rebuilt from what was found: which concepts are on screen is
    // presentation, what has been found is the game.
    const [board, setBoard] = useState<string[]>(() => {
        const stored = loadFound();
        return stored.length > 0
            ? refill([...new Set(stored.flatMap((g) => g.concepts))], pool, stored, ACTIVE_CONCEPTS)
            : openingBoard(pool, ACTIVE_CONCEPTS);
    });

    const [selected, setSelected] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<Feedback>('none');
    const [announcing, setAnnouncing] = useState<Achievement[]>([]);
    const [dismissedEnd, setDismissedEnd] = useState(false);

    // Progress is read when an event arrives rather than rendered, so it lives
    // in a ref: a state update per toggle would re-render the board for
    // nothing. Only the earned ids, which the panel shows, are state.
    const progress = useRef<Progress | null>(null);
    if (progress.current === null) {
        progress.current = recordEvent(emptyProgress(lifetimeAtStart), {
            type: 'board-dealt',
            at: Date.now(),
            groups: formableGroups(board, pool, found).length,
        }).progress;
    }

    const [unlocked, setUnlocked] = useState<string[]>(() => progress.current!.lifetime.unlocked);
    const [muted, setMuted] = useState(loadMuted);

    const tally = useRef<RunTally>(loadRunStats());
    if (tally.current.boards === 0) {
        tally.current = { ...tally.current, boards: 1 };
        saveRunStats(tally.current);
    }

    const bumpTally = (change: Partial<RunTally>) => {
        tally.current = { ...tally.current, ...change };
        saveRunStats(tally.current);
    };

    const toggleMute = () => {
        setMuted((current) => {
            saveMuted(!current);
            return !current;
        });
    };

    const record = (event: GameEvent) => {
        const { progress: next, unlocked: earned } = recordEvent(progress.current!, event);
        progress.current = next;

        if (next.session.streak > tally.current.bestStreak) {
            bumpTally({ bestStreak: next.session.streak });
        }
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
        const outcome = resolveGuess(selected, guess, { wordings, pool, found });

        record({
            type: 'guess',
            at: Date.now(),
            correct: outcome.correct,
            property: outcome.property,
            exactName:
                outcome.property !== undefined && isExactLabel(outcome.property, guess, wordings),
            selection: selected,
        });

        if (!outcome.correct) {
            bumpTally({ wrong: tally.current.wrong + 1 });
            setFeedback('wrong');
            return false;
        }

        bumpTally({ correct: tally.current.correct + outcome.points });

        // Each concept that has just run out of properties is announced, so the
        // achievements can count them.
        const wasFinished = board.filter((name) => {
            const concept = byName.get(name);
            return concept && isFinished(concept, found);
        }).length;
        const nowFinished = board.filter((name) => {
            const concept = byName.get(name);
            return concept && isFinished(concept, outcome.found);
        }).length;
        for (let i = wasFinished; i < nowFinished; i++) {
            record({ type: 'concept-finished', at: Date.now() });
        }

        setSelected([]);
        setFeedback('correct');
        setFound(outcome.found);
        saveFound(outcome.found);

        // Finished concepts stay on the board, small and faded; fresh ones come
        // in beside them so there is always something left to work on.
        setBoard((current) => refill(current, pool, outcome.found, ACTIVE_CONCEPTS));
        return true;
    };

    const playAgain = () => {
        const kept = { ...emptyLifetime(), unlocked: progress.current!.lifetime.unlocked };
        saveLifetime(kept);
        saveFound([]);

        const fresh = openingBoard(pool, ACTIVE_CONCEPTS);
        progress.current = recordEvent(emptyProgress(kept), {
            type: 'board-dealt',
            at: Date.now(),
            groups: formableGroups(fresh, pool, []).length,
        }).progress;

        tally.current = { ...emptyRunStats(), boards: 1 };
        saveRunStats(tally.current);
        setFound([]);
        setBoard(fresh);
        setSelected([]);
        setFeedback('none');
        setDismissedEnd(false);
    };

    const concepts = board.map((name) => byName.get(name)).filter((c): c is NonNullable<typeof c> => !!c);
    const finishedCount = concepts.filter((concept) => isSpent(concept, found, pool)).length;
    const left = formableGroups(board, pool, found).length;
    const exhausted = formableGroups(pool.map((c) => c.name), pool, found).length === 0;

  return (
      <>
          {/* Debugging aid. Folded away in a built game, import and all. */}
          {import.meta.env.DEV && <Answers board={board} pool={pool} found={found} enabled />}
          <Scoreboard found={found.length} finished={finishedCount} onBoard={concepts.length} remaining={left} />
          <div className="top-right">
              <LanguageToggle />
              <Panel
                  unlocked={unlocked}
                  muted={muted}
                  onToggleMute={toggleMute}
                  onTestSound={playChime}
              />
          </div>
          <Graph concepts={concepts} pool={pool} selected={selected} found={found} onToggle={toggleConcept} />
          <Form selected={selected} feedback={feedback} onSubmit={submitGuess} />
          <Toast unlocked={announcing} onDismiss={dismissAnnouncement} />
          {exhausted && !dismissedEnd && (
              <Summary
                  stats={{
                      categories: found.length,
                      boards: tally.current.boards,
                      correct: tally.current.correct,
                      wrong: tally.current.wrong,
                      bestStreak: tally.current.bestStreak,
                      achievements: unlocked.length,
                      totalAchievements: CATALOGUE.length,
                  }}
                  onPlayAgain={playAgain}
                  onKeepPlaying={() => setDismissedEnd(true)}
              />
          )}
      </>
  );
}

export default App;
