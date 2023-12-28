import React, {useEffect} from "react";
import "./Form.css"

function Form({selectedNodes}) {

    const [inputValue, setInputValue] = React.useState("");
    const [isSubmitEnabled, setIsSubmitEnabled] = React.useState(false);

    useEffect(() => {
        setIsSubmitEnabled(selectedNodes.length >= 3 && inputValue.length > 0);
    }, [inputValue, selectedNodes]);

  const handleSubmit = () => {
    if (isSubmitEnabled) {
      console.log("Submit button clicked!");
    }
  };

    const handleChange = (e) => {
        e.preventDefault();
        setInputValue(e.target.value);
    }

    return (
        <div className="input-container">
            <input id="category-input" className="input" type="text" onChange={(e) => handleChange(e)} placeholder='Type a category here!'/>
            <button className="submit" type="submit" onClick={handleSubmit} disabled={!isSubmitEnabled}>
                Submit
            </button>
        </div>
    );
}

export default Form