import './Graph.css'
import { useBubbleLayout, VIEW_HEIGHT, VIEW_WIDTH } from './useBubbleLayout'
import type { Concept } from './types'

const RADIUS = 62;

interface GraphProps {
    concepts: Concept[];
    selected: string[];
    onToggle: (name: string) => void;
}

function Graph({ concepts, selected, onToggle }: GraphProps) {
    const points = useBubbleLayout(concepts, RADIUS);

    return (
        <svg
            className="graph"
            viewBox={`${-VIEW_WIDTH / 2} ${-VIEW_HEIGHT / 2} ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            role="group"
            aria-label="Concepts"
        >
            {concepts.map((concept, i) => {
                const { x, y } = points[i] ?? { x: 0, y: 0 };
                const isSelected = selected.includes(concept.name);
                return (
                    <g
                        key={concept.name}
                        className={isSelected ? 'bubble bubble--selected' : 'bubble'}
                        transform={`translate(${x}, ${y})`}
                        role="checkbox"
                        aria-checked={isSelected}
                        aria-label={concept.name}
                        tabIndex={0}
                        onClick={() => onToggle(concept.name)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onToggle(concept.name);
                            }
                        }}
                    >
                        <circle r={RADIUS} />
                        <text textAnchor="middle" dominantBaseline="middle">
                            {concept.name}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export default Graph;
