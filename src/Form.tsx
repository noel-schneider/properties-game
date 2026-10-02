import React from "react";
import "./Form.css"
import { useTranslator } from "./i18n";
import type { Feedback } from "./App";

export const MIN_SELECTED_CONCEPTS = 3;

interface FormProps {
    selected: string[];
    feedback: Feedback;
    /** Returns whether the guess was accepted, so the input only clears on a win. */
    onSubmit: (guess: string) => boolean;
}

function Form({ selected, feedback, onSubmit }: FormProps) {

    const { t } = useTranslator();
    const [inputValue, setInputValue] = React.useState("");

    const message: Record<Feedback, string> = {
        none: '',
        correct: t('form.correct'),
        wrong: t('form.wrong'),
    };

    const isSubmitEnabled = selected.length >= MIN_SELECTED_CONCEPTS && inputValue.trim().length > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSubmitEnabled) return;
        if (onSubmit(inputValue)) setInputValue("");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }

    return (
        <form className="input-container" onSubmit={handleSubmit}>
            <div className="input-and-submit-container">
                <input id="category-input" className="input" type="text" value={inputValue}
                       onChange={handleChange}
                       placeholder={t('form.placeholder')}/>
                <button className="submit" type="submit" disabled={!isSubmitEnabled}>
                    {t('form.submit')}
                </button>
            </div>
            <p className={`feedback feedback--${feedback}`} role="status">
                {message[feedback]}
            </p>
            <div className="press-enter-wrapper">
                <img className={"enter-key-image"} src={"/enter-key.png"} alt={t('form.enterAlt')}/>
                <p className={'small-text'}>{t('form.enterHint')}</p>
            </div>
        </form>
    );
}

export default Form
