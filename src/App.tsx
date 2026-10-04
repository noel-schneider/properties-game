import { useEffect, useMemo, useRef, useState } from 'react';
import "./App.css";
import "./controls.css";
import Answers from "./Answers";
import Form from "./Form";
import Graph from "./Graph";
import Help from "./Help";
import Scoreboard from "./Scoreboard";
import Sky from "./Sky";
import Summary from "./Summary";
import { SupportInvite } from "./Support";
import Signature from "./Signature";
import SoundNote from "./SoundNote";
import LanguageToggle from "./LanguageToggle";
import Reset from "./Reset";
import SoundToggle from "./SoundToggle";
import MusicToggle from "./MusicToggle";
import Panel from "./achievements/Panel";
import Toast from "./achievements/Toast";
import { emptyLifetime, emptyProgress, recordEvent } from "./achievements";
import { playFoundNote, playUnlockChime } from "./achievements/chime";
import {
    emptyRunStats, loadFound, loadLifetime, loadMuted, loadMusic, loadRunStats,
    saveFound, saveLifetime, saveMuted, saveMusic, saveRunStats,
} from "./achievements/storage";
import { ambientPlaying, layersFor, setAmbientLayers, startAmbient, stopAmbient } from "./ambient";
import MusicBench from "./MusicBench";
import { HINT_AGAIN, HINT_FIRST, HINT_SHOWN, hintPair } from "./hints";
import type { RunTally } from "./achievements/storage";
import { CATALOGUE } from "./achievements";
import { formableGroups, isExhausted, openingBoard, refill, waysWanted } from "./board";
import { getAllConcepts } from "./concepts";
import { countFinds, isFinished, isSpent } from "./game";
import { propertyTally } from "./properties";
import { loadAsked, saveAsked, worthAsking } from "./supporting";
import { isExactLabel } from "./guess";
import { resolveGuess } from "./round";
import { canJoin, joinGroup } from "./join";
import { useTranslator } from "./i18n";
import type { Achievement, GameEvent, Progress } from "./achievements";
import type { Solution } from "./hand";

export type Feedback = 'none' | 'correct' | 'wrong' | 'spent';

/** How long a newly dealt concept stays marked, in milliseconds. */
const ARRIVAL_MARK = 2600;


const pool = getAllConcepts();
const byName = new Map(pool.map((concept) => [concept.name, concept]));

interface AppProps {
    /** Injected so tests can watch the unlock sound without making noise. */
    playChime?: () => void;
    /** Injected too, so the tests can listen without making a sound. */
    playFound?: (step: number) => void;
}

function App({ playChime = playUnlockChime, playFound = playFoundNote }: AppProps) {

    const { wordings } = useTranslator();
    const [lifetimeAtStart] = useState(loadLifetime);
    const [found, setFound] = useState<Solution[]>(loadFound);

    // The board is rebuilt from what was found: which concepts are on screen is
    // presentation, what has been found is the game.
    const [board, setBoard] = useState<string[]>(() => {
        const stored = loadFound();
        return stored.length > 0
            ? refill([...new Set(stored.flatMap((g) => g.concepts))], pool, stored, waysWanted())
            : openingBoard(pool, waysWanted());
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
    const [music, setMusic] = useState(loadMusic);
    // Dev only: the orchestra forced to a size. A part arrives every twenty
    // concepts finished — the fifth at the eighty-sixth answer of a game, which
    // is no way to judge whether it belongs in the piece.
    const [forcedLayers, setForcedLayers] = useState<number | null>(null);

    /**
     * The bed follows the switch, and nothing else touches it.
     *
     * A browser will not let audio start without a gesture, so a player who
     * left it on last time gets it back on their first click rather than on
     * arrival — which is also the polite order.
     */
    useEffect(() => {
        if (!music) {
            stopAmbient();
            return;
        }

        startAmbient();
        if (ambientPlaying()) return;

        const begin = () => startAmbient();
        document.addEventListener('pointerdown', begin, { once: true });
        document.addEventListener('keydown', begin, { once: true });
        return () => {
            document.removeEventListener('pointerdown', begin);
            document.removeEventListener('keydown', begin);
        };
    }, [music]);

    // Stopped when the game goes, or it outlives the page it belongs to.
    useEffect(() => stopAmbient, []);

    const toggleMusic = () => {
        setMusic((playing) => {
            saveMusic(!playing);
            return !playing;
        });
    };
    // Asked once in a player's life, never once per sitting.
    const [askedForSupport, setAskedForSupport] = useState(loadAsked);

    // The two concepts the board is nudging towards, and how many nudges have
    // been given since the last find — the count is what makes the next one
    // point somewhere else.
    const [hinted, setHinted] = useState<string[]>([]);
    const nudges = useRef(0);

    // What the last answer dealt in, marked on the board for a moment. Held
    // here rather than worked out in the graph: only this knows which board a
    // concept arrived on, and a concept that was there before an answer must
    // not light up because the answer moved it.
    const [arriving, setArriving] = useState<string[]>([]);

    useEffect(() => {
        if (arriving.length === 0) return;
        const timer = setTimeout(() => setArriving([]), ARRIVAL_MARK);
        return () => clearTimeout(timer);
    }, [arriving]);

    /**
     * Refills the board and marks what that brought in.
     *
     * Worked out here and not inside a setBoard updater: an updater has to be
     * pure, and React runs it twice in development to prove it.
     */
    const deal = (current: string[], groups: Solution[]) => {
        const next = refill(current, pool, groups, waysWanted());
        setArriving(next.filter((name) => !current.includes(name)));
        setBoard(next);
    };

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
            groupSize: outcome.correct ? selected.length : undefined,
        });

        if (!outcome.correct) {
            bumpTally({ wrong: tally.current.wrong + 1 });
            setFeedback(outcome.reason === 'spent' ? 'spent' : 'wrong');
            return false;
        }

        bumpTally({ correct: tally.current.correct + outcome.points });
        // After the event, so the note is the one for where the run now stands.
        if (!muted) playFound(progress.current!.session.streak);

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
        deal(board, outcome.found);
        return true;
    };

    /**
     * A concept dropped onto a category already found.
     *
     * Settled here rather than in the board, because it is a guess like any
     * other: it can be wrong, and a wrong one costs what a wrong typed answer
     * costs. Offering the target only where the answer is right would hand the
     * player the answer with the gesture.
     */
    const dropInto = (index: number, name: string) => {
        const group = found[index];
        const concept = byName.get(name);
        if (!group || !concept) return;

        if (!canJoin(concept, group, found)) {
            bumpTally({ wrong: tally.current.wrong + 1 });
            record({
                type: 'guess', at: Date.now(), correct: false,
                exactName: false, selection: [name],
            });
            setFeedback('wrong');
            return;
        }

        const next = joinGroup(found, index, name);
        bumpTally({ correct: tally.current.correct + 1 });
        record({
            type: 'guess', at: Date.now(), correct: true, property: group.property,
            exactName: false, selection: [name], groupSize: next[index].concepts.length,
        });
        if (!muted) playFound(progress.current!.session.streak);
        if (isFinished(concept, next)) record({ type: 'concept-finished', at: Date.now() });

        setSelected([]);
        setFeedback('correct');
        setFound(next);
        saveFound(next);
        deal(board, next);
    };

    /**
     * Throws away every achievement earned.
     *
     * The counts behind them go with the list. Clearing only the earned ids
     * would leave the twenty categories still counted as found, and the
     * achievement for finding twenty would announce itself again the moment
     * anything else happened.
     *
     * No event is recorded on the way out, so nothing is earned by the act of
     * clearing — one of them is given simply for playing at a certain hour.
     */
    const forgetAchievements = () => {
        const blank = emptyLifetime();
        saveLifetime(blank);
        progress.current = emptyProgress(blank);
        setUnlocked([]);
    };

    const playAgain = () => {
        const kept = { ...emptyLifetime(), unlocked: progress.current!.lifetime.unlocked };
        saveLifetime(kept);
        saveFound([]);

        const fresh = openingBoard(pool, waysWanted());
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
    // Against the whole game, not against the board: the board grows as it is
    // played, and a fraction of it falls as concepts arrive even though the
    // player has done nothing wrong.
    //
    // Worked out only when something is found, because it walks the pool once
    // per concept — and this renders on every frame while the board settles.
    const finishedCount = useMemo(
        () => pool.filter((concept) => isSpent(concept, found, pool)).length,
        [found],
    );
    /**
     * The nudge for a player who has stalled.
     *
     * The clock restarts whenever the board changes — a right answer, or a
     * concept dropped into a group — and runs on through a wrong one, which is
     * the whole point: a player guessing and missing is exactly who this is
     * for. Each nudge lights two concepts for a few seconds and the next one
     * points somewhere else.
     */
    useEffect(() => {
        let next: ReturnType<typeof setTimeout>;
        let clear: ReturnType<typeof setTimeout>;
        nudges.current = 0;
        setHinted([]);

        const nudge = () => {
            const pair = hintPair(formableGroups(board, pool, found), nudges.current++);
            if (pair) setHinted(pair);
            clear = setTimeout(() => setHinted([]), HINT_SHOWN);
            next = setTimeout(nudge, HINT_AGAIN);
        };

        next = setTimeout(nudge, HINT_FIRST);
        return () => {
            clearTimeout(next);
            clearTimeout(clear);
        };
    }, [found, board]);

    // The orchestra grows with the game: one more part every twenty concepts
    // finished, up to five. Set here rather than inside the player, which has
    // no idea what a concept is.
    useEffect(() => {
        setAmbientLayers(forcedLayers ?? layersFor(finishedCount));
    }, [finishedCount, forcedLayers]);

    // Walks the pool once, so it is worked out when something is found rather
    // than on every frame the board settles through.
    const namedSoFar = useMemo(() => propertyTally(found, pool), [found]);
    const left = formableGroups(board, pool, found).length;
    // Not merely "no trio can be formed": a concept can still be dropped into
    // a category already found, and there are fourteen such moves waiting at
    // the moment the last trio goes.
    const exhausted = isExhausted(pool, found);

  return (
      <>
          <Sky />
          {/* Debugging aid. Folded away in a built game, import and all. */}
          {import.meta.env.DEV && <Answers board={board} pool={pool} found={found} enabled />}
          {import.meta.env.DEV && (
              <MusicBench
                  forced={forcedLayers}
                  onPick={(count) => {
                      setForcedLayers(count);
                      if (!music) toggleMusic();
                  }}
              />
          )}
          <SoundNote muted={muted} />
          <Scoreboard finds={countFinds(found)} finished={finishedCount} total={pool.length} remaining={left} properties={namedSoFar} />
          <div className="corner corner--top-right">
              <Help />
              <LanguageToggle />
              <Reset onReset={playAgain} />
              <SoundToggle muted={muted} onToggle={toggleMute} />
              <MusicToggle playing={music} onToggle={toggleMusic} />
          </div>
          <Graph concepts={concepts} pool={pool} selected={selected} found={found} arriving={arriving} hinted={hinted} onToggle={toggleConcept} onDropInto={dropInto} />
          <Form selected={selected} feedback={feedback} onSubmit={submitGuess} />
          <div className="corner corner--bottom-left">
              <Signature />
          </div>
          <div className="corner corner--bottom-right">
              <Panel unlocked={unlocked} onForget={forgetAchievements} />
          </div>
          {worthAsking({ finds: countFinds(found), asked: askedForSupport }) && (
              <SupportInvite onDismiss={() => { saveAsked(); setAskedForSupport(true); }} />
          )}
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
