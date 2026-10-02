import React from "react";
import "./Form.css"
import type { Feedback } from "./App";

export const MIN_SELECTED_CONCEPTS = 3;

const FEEDBACK_MESSAGE: Record<Feedback, string> = {
    none: '',
    correct: 'Correct!',
    wrong: 'Not quite — try another category.',
};

interface FormProps {
    selected: string[];
    feedback: Feedback;
    /** Returns whether the guess was accepted, so the input only clears on a win. */
    onSubmit: (guess: string) => boolean;
}

function Form({ selected, feedback, onSubmit }: FormProps) {

    const [inputValue, setInputValue] = React.useState("");

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
                       placeholder='Type a category here!'/>
                <button className="submit" type="submit" disabled={!isSubmitEnabled}>
                    Submit
                </button>
            </div>
            <p className={`feedback feedback--${feedback}`} role="status">
                {FEEDBACK_MESSAGE[feedback]}
            </p>
            <div className="press-enter-wrapper">
                <img className={"enter-key-image"} src={"/enter-key.png"} alt={'Press enter'}/>
                <p className={'small-text'}>Press 'Enter' to submit!</p>
            </div>
        </form>
    );
}

export default Form
