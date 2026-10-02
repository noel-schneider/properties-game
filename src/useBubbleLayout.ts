import { useEffect, useMemo, useState } from 'react'
import { forceCollide, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force'
import type { Concept } from './types'

export interface Point {
    x: number;
    y: number;
}

/**
 * The frame the bubbles live in. Fixed rather than fitted to the cluster: a
 * viewBox recomputed every tick would zoom the whole board in and out as the
 * bubbles move, which reads as the camera lurching rather than the bubbles
 * drifting.
 */
export const VIEW_WIDTH = 820;
export const VIEW_HEIGHT = 660;

const CENTRE: Point = { x: 0, y: 0 };

interface LayoutNode {
    x: number;
    y: number;
}

/**
 * Bubbles start huddled at the centre rather than on d3's default spiral, which
 * already looks settled. From here the collision force throws them apart, which
 * is the entrance worth watching.
 */
function huddle(): LayoutNode {
    return { x: (Math.random() - 0.5) * 30, y: (Math.random() - 0.5) * 30 };
}

function prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Lays the bubbles out by simulation, drawing every tick.
 *
 * The simulation is animated rather than run to completion: watching them
 * jostle into place is most of the character of the board. It does come to
 * rest, though — a bubble that never stops moving is a bubble that is annoying
 * to aim at, and the first version of this game was unplayable for exactly
 * that reason.
 *
 * Only coordinates are returned, never the concepts themselves. Positions
 * arrive a frame behind a new board, and pairing them with concepts here would
 * mean rendering the previous board's names for that frame.
 */
export function useBubbleLayout(concepts: Concept[], radius: number): Point[] {
    const nodes = useMemo<LayoutNode[]>(() => concepts.map(huddle), [concepts]);
    const [points, setPoints] = useState<Point[]>([]);

    useEffect(() => {
        const read = () => nodes.map((node) => ({ x: node.x, y: node.y }));

        const simulation = forceSimulation(nodes)
            // Pulled harder vertically than horizontally, so the cluster comes
            // out landscape like the frame it has to fit in.
            .force('towardsCentreX', forceX(CENTRE.x).strength(0.035))
            .force('towardsCentreY', forceY(CENTRE.y).strength(0.09))
            .force('spread', forceManyBody().strength(-24))
            .force('collide', forceCollide(radius + 1).strength(0.9))
            .alphaDecay(0.028)
            // Stops once the movement is no longer visible. The default would
            // keep ticking imperceptibly for another second and a half, which
            // costs nothing on screen and makes every end-to-end click wait.
            .alphaMin(0.01)
            .stop();

        if (prefersReducedMotion()) {
            simulation.tick(400);
            setPoints(read());
            return;
        }

        let frame = 0;
        const step = () => {
            simulation.tick();
            setPoints(read());

            if (simulation.alpha() > simulation.alphaMin()) {
                frame = requestAnimationFrame(step);
            }
        };

        setPoints(read());
        frame = requestAnimationFrame(step);

        return () => cancelAnimationFrame(frame);
    }, [nodes, radius]);

    return points;
}
