import { useRef, useState } from 'react';
import "./App.css";
import Form from "./Form";
import Graph from "./Graph";
import Scoreboard from "./Scoreboard";
import Summary from "./Summary";
import LanguageToggle from "./LanguageToggle";
import Panel from "./achievements/Panel";
import Toast from "./achievements/Toast";
import { emptyLifetime, emptyProgress, recordEvent } from "./achievements";
import { playUnlockChime } from "./achievements/chime";
import { emptyRunStats, loadLifetime, loadMuted, loadRunStats, saveLifetime, saveMuted, saveRunStats } from "./achievements/storage";
import type { RunTally } from "./achievements/storage";
import { CATALOGUE } from "./achievements";
import { allProperties, dealRound, getAllConcepts } from "./concepts";
import { isExactLabel } from "./guess";
import { resolveGuess } from "./round";
import { useTranslator } from "./i18n";
import type { Achievement, GameEvent, Progress } from "./achievements";

export type Feedback = 'none' | 'correct' | 'wrong';

const pool = getAllConcepts();
const TOTAL_CATEGORIES = allProperties().length;

interface AppProps {
    /** Injected so tests can watch the unlock sound without making noise. */
    playChime?: () => void;
}

function App({ playChime = playUnlockChime }: AppProps) {

    const { wordings } = useTranslator();
    const [lifetimeAtStart] = useState(loadLifetime);
    const [hand, setHand] = useState(() => dealRound(lifetimeAtStart.propertiesFound));
    const [selected, setSelected] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<Feedback>('none');
    const [announcing, setAnnouncing] = useState<Achievement[]>([]);

    // Progress is read when an event arrives rather than rendered, so it lives
    // in a ref: a state update per toggle would re-render the board for
    // nothing. Only the earned ids, which the panel shows, are state.
    const progress = useRef<Progress | null>(null);
    if (progress.current === null) {
        progress.current = recordEvent(emptyProgress(lifetimeAtStart), {
            type: 'board-dealt',
            at: Date.now(),
            groups: hand.solutions.length,
        }).progress;
    }

    const [unlocked, setUnlocked] = useState<string[]>(() => progress.current!.lifetime.unlocked);
    const [found, setFound] = useState<string[]>(() => progress.current!.lifetime.propertiesFound);
    const [finished, setFinished] = useState(false);
    const [dismissedEnd, setDismissedEnd] = useState(false);
    // The run spans sessions, so its tally is persisted too. A summary reading
    // "51 categories" next to "1 board" would be counting two different things.
    const tally = useRef<RunTally>(loadRunStats());
    if (tally.current.boards === 0) {
        tally.current = { ...tally.current, boards: 1 };
        saveRunStats(tally.current);
    }

    const bumpTally = (change: Partial<RunTally>) => {
        tally.current = { ...tally.current, ...change };
        saveRunStats(tally.current);
    };
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

        setFound(next.lifetime.propertiesFound);
        if (next.session.streak > tally.current.bestStreak) {
            bumpTally({ bestStreak: next.session.streak });
        }
        if (next.lifetime.propertiesFound.length >= TOTAL_CATEGORIES) setFinished(true);

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
        const outcome = resolveGuess(hand, selected, guess, { wordings, pool });

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
        setSelected([]);
        setFeedback('correct');

        // A hand with nothing left to find is a dead board, so the next round
        // is dealt straight away.
        const next =
            outcome.hand.solutions.length > 0
                ? outcome.hand
                : dealRound(progress.current!.lifetime.propertiesFound);
        setHand(next);
        if (next !== outcome.hand) {
            bumpTally({ boards: tally.current.boards + 1 });
            record({ type: 'board-dealt', at: Date.now(), groups: next.solutions.length });
        }
        return true;
    };

    // Playing again clears the categories only. Achievements are never taken
    // back, so the lifetime counters that feed them survive the reset.
    const playAgain = () => {
        const kept = { ...emptyLifetime(), unlocked: progress.current!.lifetime.unlocked };
        saveLifetime(kept);

        const fresh = dealRound([]);
        progress.current = recordEvent(emptyProgress(kept), {
            type: 'board-dealt',
            at: Date.now(),
            groups: fresh.solutions.length,
        }).progress;

        tally.current = { ...emptyRunStats(), boards: 1 };
        saveRunStats(tally.current);
        setHand(fresh);
        setSelected([]);
        setFeedback('none');
        setFound([]);
        setFinished(false);
        setDismissedEnd(false);
    };

  return (
      <>
          <Scoreboard found={found.length} total={TOTAL_CATEGORIES} remaining={hand.solutions.length} />
          <div className="top-right">
              <LanguageToggle />
              <Panel unlocked={unlocked} muted={muted} onToggleMute={toggleMute} />
          </div>
          <Graph concepts={hand.concepts} selected={selected} onToggle={toggleConcept} />
          <Form selected={selected} feedback={feedback} onSubmit={submitGuess} />
          <Toast unlocked={announcing} onDismiss={dismissAnnouncement} />
          {finished && !dismissedEnd && (
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
