import { useMemo, useState } from 'react';
import Form from "./Form";
import Graph from "./Graph";
import { getRandomConcepts } from "./concepts";

const CONCEPTS_PER_ROUND = 15;

function App() {

    const concepts = useMemo(() => getRandomConcepts(CONCEPTS_PER_ROUND), []);
    const [selected, setSelected] = useState<string[]>([]);

    const toggleConcept = (name: string) => {
        setSelected((current) =>
            current.includes(name)
                ? current.filter((n) => n !== name)
                : [...current, name]
        );
    };

  return (
      <>
          <Graph concepts={concepts} selected={selected} onToggle={toggleConcept} />
          <Form selected={selected} />
      </>
  );
}

export default App;
