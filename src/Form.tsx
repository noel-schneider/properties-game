import React from "react";
import "./Form.css"

export const MIN_SELECTED_CONCEPTS = 3;

interface FormProps {
    selected: string[];
}

function Form({ selected }: FormProps) {

    const [inputValue, setInputValue] = React.useState("");

    const isSubmitEnabled = selected.length >= MIN_SELECTED_CONCEPTS && inputValue.trim().length > 0;

    // TODO: check the guess against the properties shared by the selected
    // concepts, then flash the background and deal a new set of concepts.
    const handleSubmit = () => {
        if (!isSubmitEnabled) return;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }

    return (
        <div className="input-container">
            <div className="input-and-submit-container">
                <input id="category-input" className="input" type="text" value={inputValue}
                       onChange={handleChange}
                       placeholder='Type a category here!'/>
                <button className="submit" type="submit" onClick={handleSubmit} disabled={!isSubmitEnabled}>
                    Submit
                </button>
            </div>
            <div className="press-enter-wrapper">
                <img className={"enter-key-image"} src={"/enter-key.png"} alt={'Press enter'}/>
                <p className={'small-text'}>Press 'Enter' to start typing!</p>
            </div>
        </div>
    );
}

export default Form
