import React from "react";
import "./Tutorial.css"
import Graph from "./Graph";
import Form from "./Form";
import { useTranslator } from "./i18n";
import {
    DECOYS, NEWCOMER, TRIO,
    answer, clearSelection, drop, startTour, stepOf, toggle,
} from "./tour";
import type { Concept } from "./types";
import type { Frame } from "./useBubbleLayout";

/**
 * Seven concepts and a newcomer have no use for the game's whole upright
 * frame, and on a phone the card above takes a good part of the screen: a
 * tighter frame draws them at a size a finger can hit.
 */
const UPRIGHT: Frame = { width: 520, height: 620 };

interface TutorialProps {
    /** Every concept the game knows; the tutorial takes its handful from it. */
    pool: Concept[];
    muted: boolean;
    playFound: (step: number) => void;
    playReady: () => void;
    /** Played through or skipped: either way, on to the game. */
    onDone: () => void;
}

/**
 * The two gestures the game is built on, taught by having them done.
 *
 * A board of its own, written by hand so the lesson always works: three
 * insects among three decoys, named, and then a fourth insect dragged into the
 * group they made. The real board and form do the work, so what is learnt
 * here is exactly what is met in the game. Nothing here is saved or counted —
 * not the found group, not a single achievement.
 *
 * The rest of the game — the reveal, the gauges, the hint — is left to be
 * found by playing. Two lessons is about as much as anybody reads before they
 * want to start.
 */
function Tutorial({ pool, muted, playFound, playReady, onDone }: TutorialProps) {
    const { t, wordings } = useTranslator();
    const [tour, setTour] = React.useState(startTour);

    const concepts = React.useMemo(() => {
        const wanted = new Set<string>([...TRIO, ...DECOYS, NEWCOMER]);
        return pool.filter((concept) => wanted.has(concept.name));
    }, [pool]);
    const onBoard = concepts.filter((concept) => tour.board.includes(concept.name));

    const step = stepOf(tour);

    const pick = (name: string) => {
        const next = toggle(tour, name);
        if (tour.selected.length < 3 && next.selected.length === 3 && !muted) playReady();
        setTour(next);
    };

    const name = (guess: string): boolean => {
        const settled = answer(tour, guess, { wordings, concepts });
        if (settled.correct && !muted) playFound(0);
        setTour(settled.tour);
        return settled.correct;
    };

    const dropInto = (index: number, concept: string) => {
        const settled = drop(tour, index, concept, concepts);
        if (settled.correct && !muted) playFound(1);
        setTour(settled.tour);
    };

    const says = {
        pick: t('tutorial.pick'),
        name: t('tutorial.name'),
        // The form, which says no to a wrong answer, is gone by this step,
        // so a wrong drop is answered here instead.
        drag: tour.feedback === 'wrong' ? t('tutorial.dragWrong') : t('tutorial.drag'),
        done: t('tutorial.done'),
    }[step];

    return (
        <>
            <section className="tutorial" aria-label={t('tutorial.label')}>
                <p className="tutorial__step">
                    {step === 'pick' || step === 'name' ? t('tutorial.step1') : t('tutorial.step2')}
                </p>
                {/* Polite: each step replaces the last, and is the thing to read next. */}
                <p className="tutorial__says" aria-live="polite">{says}</p>
                {step === 'done' ? (
                    <button type="button" className="control tutorial__start" onClick={onDone}>
                        {t('tutorial.start')}
                    </button>
                ) : (
                    <button type="button" className="tutorial__skip" onClick={onDone}>
                        {t('tutorial.skip')}
                    </button>
                )}
            </section>
            <Graph
                concepts={onBoard}
                // The whole game's pool, not the tutorial's handful: measured
                // against seven concepts the decoys have nobody to share a
                // category with, and the board draws them as spent.
                pool={pool}
                selected={tour.selected}
                found={tour.found}
                arriving={tour.arriving}
                onToggle={pick}
                onDropInto={dropInto}
                onClear={() => setTour(clearSelection)}
                upright={UPRIGHT}
            />
            {/* Gone once the group is named: the second lesson is a drag, and a
                box asking to be typed in would be pointing the wrong way. */}
            {step !== 'drag' && step !== 'done' && (
                <Form selected={tour.selected} feedback={tour.feedback} onSubmit={name} />
            )}
        </>
    );
}

export default Tutorial;
