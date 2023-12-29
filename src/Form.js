import React, {useEffect} from "react";
import "./Form.css"

function Form({selectedNodes}) {

    const [inputValue, setInputValue] = React.useState("");
    const [isSubmitEnabled, setIsSubmitEnabled] = React.useState(false);

    useEffect(() => {
        setIsSubmitEnabled(selectedNodes.length >= 3 && inputValue.length > 0);
    }, [inputValue, selectedNodes]);

    const checkIfCorrect = () => {
        const selectedNodesHaveTheSameCategory = selectedNodes.every(node => node.name === selectedNodes[0].name);
    }

    // TODO: Move the handleSubmit function to App.js or Graph.js
  const handleSubmit = () => {
    if (isSubmitEnabled) {
      console.log("Submit button clicked!");
      // const isCorrect = checkIfCorrect();
      // if (isCorrect) {
      //   console.log("Correct!");
      //   changeBackgroundForFewSeconds("green");
      //   addNewNodes();
      // } else {
      //   console.log("Incorrect!");
      //   changeBackgroundForFewSeconds("red")
      // }
    }
  };

    const handleChange = (e) => {
        e.preventDefault();
        setInputValue(e.target.value);
    }

    return (
        <div className="input-container">
            <div className="input-and-submit-container">
                <input id="category-input" className="input" type="text" onChange={(e) => handleChange(e)}
                       placeholder='Type a category here!'/>
                <button className="submit" type="submit" onClick={handleSubmit} disabled={!isSubmitEnabled}>
                    Submit
                </button>
            </div>
            <div className="press-enter-wrapper">
                <img className={"enter-key-image"} src={process.env.PUBLIC_URL + "/enter-key.png"} alt={'Press enter'}/>
                <p className={'small-text'}>Press 'Enter' to select!</p>
            </div>
        </div>
    );
}

export default Form