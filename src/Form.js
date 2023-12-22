import React from "react";
import "./Form.css"

function Form() {
    return (
        <div className="input-container">
            <input className="input" type="text" placeholder='Type a category here!'/>
            <button className="submit" type="submit">
                Submit
            </button>
        </div>
    );
}

export default Form