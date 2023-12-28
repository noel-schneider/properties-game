import React, {useState} from 'react';
import Form from "./Form";
import Graph from "./Graph";

function App() {

    const [selectedNodes, setSelectedNodes] = useState([]);

    const updateSelectedNodes = (nodes) => {
        setSelectedNodes(nodes);
    };

  return (
      <>
          <Form selectedNodes={selectedNodes} />
          <Graph updateSelectedNodes={updateSelectedNodes} />
      </>
  );
}

export default App;