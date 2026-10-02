import { useRef } from 'react'
import './Graph.css'
import { useBubbleLayout, VIEW_HEIGHT, VIEW_WIDTH } from './useBubbleLayout'
import type { Point } from './useBubbleLayout'
import type { Concept } from './types'

const RADIUS = 62;

/** Past this much travel the gesture is a drag, and must not also select. */
const DRAG_THRESHOLD = 4;

interface GraphProps {
    concepts: Concept[];
    selected: string[];
    onToggle: (name: string) => void;
}

interface Gesture {
    index: number;
    startedAt: Point;
    moved: boolean;
}

function Graph({ concepts, selected, onToggle }: GraphProps) {
    const { points, settled, grab, dragTo, release } = useBubbleLayout(concepts, RADIUS);
    const svg = useRef<SVGSVGElement>(null);
    const gesture = useRef<Gesture | null>(null);

    /**
     * Pointer coordinates in the viewBox's own units. Returns null where the
     * browser cannot supply the transform, which is the case under jsdom —
     * dragging is covered end to end instead.
     */
    const toViewBox = (event: { clientX: number; clientY: number }): Point | null => {
        const element = svg.current;
        const matrix = element?.getScreenCTM?.();
        if (!element || !matrix) return null;

        const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
        return { x: point.x, y: point.y };
    };

    const onPointerDown = (index: number) => (event: React.PointerEvent<SVGGElement>) => {
        if (event.button !== 0) return;

        gesture.current = { index, startedAt: { x: event.clientX, y: event.clientY }, moved: false };
        event.currentTarget.setPointerCapture?.(event.pointerId);
        grab(index);
    };

    const onPointerMove = (event: React.PointerEvent<SVGGElement>) => {
        const held = gesture.current;
        if (!held) return;

        const travelled = Math.hypot(
            event.clientX - held.startedAt.x,
            event.clientY - held.startedAt.y,
        );
        if (travelled > DRAG_THRESHOLD) held.moved = true;

        const point = toViewBox(event);
        if (point) dragTo(held.index, point);
    };

    const onPointerUp = (event: React.PointerEvent<SVGGElement>) => {
        const held = gesture.current;
        if (!held) return;

        event.currentTarget.releasePointerCapture?.(event.pointerId);
        release(held.index);
    };

    // The click arrives after the pointer is released, which is where a drag
    // gets told apart from a tap: a gesture that travelled selects nothing.
    const onClick = (name: string) => () => {
        const dragged = gesture.current?.moved ?? false;
        gesture.current = null;
        if (!dragged) onToggle(name);
    };

    return (
        <svg
            ref={svg}
            className="graph"
            data-settled={settled}
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
                        onPointerDown={onPointerDown(i)}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                        onClick={onClick(concept.name)}
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
