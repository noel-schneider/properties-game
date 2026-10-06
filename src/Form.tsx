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
     * Below three, the box goes grey and says what it is waiting for.
     *
     * Read only rather than disabled: a disabled input cannot take the focus,
     * and the enter shortcut — press it anywhere to start typing — would land
     * nowhere at all for a player who has picked one bubble. This way the box
     * can still be reached and still refuses what cannot be answered.
     *
     * The reminder lives in the placeholder rather than on the answer line
     * below. The line is where the game replies to a guess; a state of the
     * board is not a reply, and putting it there made every grey box look
     * like a wrong answer.
     */
    const says = stale ? '' : message[feedback];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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
                <input ref={input} id="category-input" className="input" type="text" value={inputValue}
                       onChange={handleChange}
                       readOnly={!enough}
                       aria-disabled={!enough}
                       placeholder={enough ? t('form.placeholder') : t('form.needThree')}/>
                <button className="submit" type="submit" disabled={!isSubmitEnabled}>
                    {t('form.submit')}
                </button>
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
