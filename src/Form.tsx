import React from "react";
import "./Form.css"
import { useTranslator } from "./i18n";
import type { Feedback } from "./App";

export const MIN_SELECTED_CONCEPTS = 3;

/**
 * How long a verdict stays before it clears itself.
 *
 * Long enough to read twice without hurrying, short enough that the answer to
 * the last guess is not still sitting there while the next one is being typed.
 * Only verdicts are on a clock: the reminder about picking three describes a
 * state of the board, and a state does not expire.
 */
export const VERDICT_SECONDS = 5;

interface FormProps {
    selected: string[];
    feedback: Feedback;
    /** Returns whether the guess was accepted, so the input only clears on a win. */
    onSubmit: (guess: string) => boolean;
}

function Form({ selected, feedback, onSubmit }: FormProps) {

    const { t } = useTranslator();
    const [inputValue, setInputValue] = React.useState("");
    const [stale, setStale] = React.useState(false);
    /**
     * How many answers have been sent, so a refusal can be seen twice.
     *
     * Two wrong answers running leave `feedback` on the same value, and a
     * class that depends only on that never changes — so the box rocks once
     * and then sits still however many times it refuses. This counter is what
     * makes the second refusal a different class from the first.
     */
    const [attempts, setAttempts] = React.useState(0);
    const input = React.useRef<HTMLInputElement>(null);

    // Each new verdict starts its own clock, and clears the one before it.
    React.useEffect(() => {
        setStale(false);
        if (feedback === 'none') return;

        const timer = setTimeout(() => setStale(true), VERDICT_SECONDS * 1000);
        return () => clearTimeout(timer);
    }, [feedback]);

    const message: Record<Feedback, string> = {
        none: '',
        correct: t('form.correct'),
        wrong: t('form.wrong'),
        // Said apart from a plain miss: the three do share this one, and one of
        // them has used it up. Denying that they share it would be a lie, and
        // the group that used it is drawn on the board anyway.
        spent: t('form.spent'),
    };

    const enough = selected.length >= MIN_SELECTED_CONCEPTS;
    const isSubmitEnabled = enough && inputValue.trim().length > 0;

    /*
     * The third pick brings the box, with the cursor already in it.
     *
     * That is the moment the player starts thinking of a name, and a click on
     * the box was a step between the thought and the typing. Only as the
     * third arrives — not on mount, so a board restored with three already
     * picked does not grab the cursor, and not on every render after, so a
     * player who has clicked away is not pulled back. Never past an open
     * modal, which owns the keyboard while it is up.
     */
    const wasEnough = React.useRef(enough);
    React.useEffect(() => {
        const arrived = enough && !wasEnough.current;
        wasEnough.current = enough;
        if (!arrived) return;
        if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;

        input.current?.focus({ preventScroll: true });
    }, [enough]);

    /*
     * Below three there is no box at all, only a line saying what to do.
     *
     * A box shown before it can be used was read as the first thing to do:
     * players clicked into it and typed before picking anything. Until three
     * are picked the row says how many are still wanted instead, at the same
     * height, so the board does not shift when the box arrives.
     *
     * The reminder lives in that row rather than on the answer line below.
     * The line is where the game replies to a guess; a state of the board is
     * not a reply.
     */
    const says = stale ? '' : message[feedback];

    /*
     * What is still to pick, counted down.
     *
     * One sentence for every count rather than "pick three" throughout: with
     * one bubble picked, "pick three concepts" reads as if the click did not
     * take, and a tester read it as being about the box rather than the board.
     */
    const reminder = [t('form.needThree'), t('form.needTwo'), t('form.needOne')][
        Math.min(selected.length, MIN_SELECTED_CONCEPTS - 1)
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAttempts((sent) => sent + 1);
        if (!isSubmitEnabled) return;
        if (onSubmit(inputValue)) setInputValue("");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }

    /**
     * Enter puts the cursor in the box, so a guess costs no extra click.
     *
     * Three things keep the key instead. A modal, whose own confirm button
     * needs it. The box itself, where Enter submits. And a control the player
     * reached with the keyboard: a mouse click leaves the focus on the bubble
     * it hit — which is why Enter used to quietly deselect the bubble just
     * clicked — but someone tabbing through the board means to press that one.
     *
     * Which of the two happened is tracked here rather than read from
     * :focus-visible, which looks like the browser's own answer to this
     * question and is not. Pressing a key puts the browser in keyboard
     * modality before the handler runs, so a bubble focused by mouse reports
     * :focus-visible false right up until the Enter that asks about it, and
     * true from inside the handler. Measured, after it quietly did nothing.
     */
    const viaPointer = React.useRef(false);

    React.useEffect(() => {
        const pointed = () => { viaPointer.current = true; };
        const tabbed = (event: KeyboardEvent) => {
            if (event.key === 'Tab') viaPointer.current = false;
        };

        const reach = (event: KeyboardEvent) => {
            if (event.key !== 'Enter') return;

            const box = input.current;
            const active = document.activeElement;
            if (!box || active === box) return;

            // Anywhere on the page, not merely under the focus: a modal makes
            // the board behind it inert whether or not anything in it is focused.
            if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;

            // Nothing holds the key, or whatever holds it was reached by mouse.
            const ownerless = !active || active === document.body;
            if (!ownerless && !viaPointer.current) return;

            // Stopped outright, not merely defaulted away. preventDefault does
            // not halt propagation, so without this the press still reaches
            // React's root listener and toggles the bubble the mouse left the
            // focus on — deselecting what the player had just picked.
            event.preventDefault();
            event.stopPropagation();
            box.focus();
        };

        // Captured on the way down. React attaches its own handlers at the root,
        // so a bubble's onKeyDown would otherwise run first and call
        // preventDefault — the press would toggle the bubble and never arrive.
        document.addEventListener('pointerdown', pointed, true);
        document.addEventListener('keydown', tabbed, true);
        document.addEventListener('keydown', reach, true);
        return () => {
            document.removeEventListener('pointerdown', pointed, true);
            document.removeEventListener('keydown', tabbed, true);
            document.removeEventListener('keydown', reach, true);
        };
    }, []);

    return (
        <form className="input-container" onSubmit={handleSubmit}>
            <div className="input-and-submit-container">
                {enough ? (
                    <div className="answer-row">
                        <input
                            ref={input}
                            id="category-input"
                            /*
                             * A refusal rocks the box. Which of the two names
                             * it takes alternates with the count of answers
                             * sent: a running animation ignores a request to
                             * start again, so two wrong answers in a row need
                             * two different classes or the second one is
                             * silent.
                             */
                            className={
                                !stale && (feedback === 'wrong' || feedback === 'spent')
                                    ? `input input--refused-${attempts % 2 === 0 ? 'a' : 'b'}`
                                    : 'input'
                            }
                            type="text"
                            value={inputValue}
                            onChange={handleChange}
                            placeholder={t('form.placeholder')}/>
                        <button className="submit" type="submit" disabled={!isSubmitEnabled}>
                            {t('form.submit')}
                        </button>
                    </div>
                ) : (
                    /*
                     * The same count as three pips, lit as bubbles are picked
                     * — readable at a glance, in the gold the picked bubbles
                     * wear. The words carry it for a screen reader; the pips
                     * are decoration.
                     */
                    <p className="pick-prompt" aria-live="polite">
                        <span className="pick-prompt__text">{reminder}</span>
                        <span className="pick-count" aria-hidden="true">
                            {Array.from({ length: MIN_SELECTED_CONCEPTS }, (_, i) => (
                                <span
                                    key={i}
                                    className={`pick-count__pip${i < selected.length ? ' pick-count__pip--lit' : ''}`}
                                />
                            ))}
                        </span>
                    </p>
                )}
            </div>
            <p className={`feedback feedback--${feedback}`} role="status">
                {says}
            </p>
            <div className="press-enter-wrapper">
                <img className={"enter-key-image"} src={"/enter-key.png"} alt={t('form.enterAlt')}/>
                <p className={'small-text'}>{t('form.enterHint')}</p>
            </div>
        </form>
    );
}

export default Form
