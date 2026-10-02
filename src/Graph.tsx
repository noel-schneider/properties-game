import './Graph.css'
import { useBubbleLayout } from './useBubbleLayout'
import type { Concept } from './types'

const RADIUS = 62;

interface GraphProps {
    concepts: Concept[];
    selected: string[];
    onToggle: (name: string) => void;
}

function Graph({ concepts, selected, onToggle }: GraphProps) {
    const { bubbles, viewBox } = useBubbleLayout(concepts, RADIUS);

    return (
        <svg
            className="graph"
            viewBox={viewBox}
            role="group"
            aria-label="Concepts"
        >
            {bubbles.map(({ concept, x, y }) => {
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
