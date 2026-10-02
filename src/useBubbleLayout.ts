import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { forceCollide, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force'
import type { Simulation } from 'd3-force'
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
export const VIEW_WIDTH = 1560;
export const VIEW_HEIGHT = 700;

/**
 * The hard minimum between two bubbles. Deliberately small: when collision is
 * what sets the spacing, every bubble ends up at exactly this distance from its
 * neighbours and the board comes out as a honeycomb. Repulsion sets the real
 * spacing, and collision only stops bubbles overlapping when it is crowded.
 */
export const BUBBLE_GAP = 6;

const CENTRE: Point = { x: 0, y: 0 };

/** How warm the simulation is kept while a bubble is being dragged. */
const DRAG_HEAT = 0.3;

interface LayoutNode {
    x: number;
    y: number;
    fx?: number | null;
    fy?: number | null;
}

export interface Layout {
    points: Point[];
    /** True once the board has stopped moving and can be aimed at. */
    settled: boolean;
    /** Takes hold of a bubble, pinning it under the pointer. */
    grab: (index: number) => void;
    /** Moves the held bubble, in viewBox coordinates. */
    dragTo: (index: number, point: Point) => void;
    /** Lets go, handing the bubble back to the simulation. */
    release: (index: number) => void;
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
 * Lays the bubbles out by simulation, drawing every tick, and lets them be
 * dragged around.
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
export function useBubbleLayout(concepts: Concept[], radius: number): Layout {
    const nodes = useMemo<LayoutNode[]>(() => concepts.map(huddle), [concepts]);
    const [points, setPoints] = useState<Point[]>([]);

    const [settled, setSettled] = useState(false);
    const simulation = useRef<Simulation<LayoutNode, undefined> | null>(null);
    const running = useRef(false);
    const frame = useRef(0);

    // Restarts the drawing loop. The loop ends itself once the board settles,
    // so anything that disturbs it — a drag, above all — has to wake it again.
    const wake = useCallback(() => {
        const sim = simulation.current;
        if (!sim || running.current || prefersReducedMotion()) return;

        running.current = true;
        setSettled(false);
        const step = () => {
            sim.tick();
            setPoints(nodes.map((node) => ({ x: node.x, y: node.y })));

            if (sim.alpha() > sim.alphaMin()) {
                frame.current = requestAnimationFrame(step);
            } else {
                running.current = false;
                setSettled(true);
            }
        };
        frame.current = requestAnimationFrame(step);
    }, [nodes]);

    useEffect(() => {
        const sim = forceSimulation(nodes)
            // Pulled harder vertically than horizontally, so the cluster comes
            // out landscape like the frame it has to fit in.
            .force('towardsCentreX', forceX(CENTRE.x).strength(0.06))
            .force('towardsCentreY', forceY(CENTRE.y).strength(0.14))
            // Strong enough that the distance between bubbles is settled by
            // repulsion against this pull, rather than by collision. That is
            // what gives the uneven spacing a graph has and a packed tray of
            // marbles does not.
            .force('spread', forceManyBody().strength(-1400))
            .force('collide', forceCollide(radius + BUBBLE_GAP).strength(0.9))
            .alphaDecay(0.028)
            // Stops once the movement is no longer visible. The default would
            // keep ticking imperceptibly for another second and a half, which
            // costs nothing on screen and makes every end-to-end click wait.
            .alphaMin(0.01)
            .stop();

        simulation.current = sim;
        setPoints(nodes.map((node) => ({ x: node.x, y: node.y })));

        if (prefersReducedMotion()) {
            sim.tick(400);
            setPoints(nodes.map((node) => ({ x: node.x, y: node.y })));
            setSettled(true);
            return;
        }

        wake();

        return () => {
            cancelAnimationFrame(frame.current);
            running.current = false;
            simulation.current = null;
        };
    }, [nodes, radius, wake]);

    // Taking hold pins the bubble but does not stir the board. A plain click is
    // a grab and a release with nothing in between, and it should leave a
    // settled board exactly as it was.
    const grab = useCallback((index: number) => {
        const node = nodes[index];
        if (!node) return;

        node.fx = node.x;
        node.fy = node.y;
    }, [nodes]);

    const dragTo = useCallback((index: number, point: Point) => {
        const node = nodes[index];
        if (!node) return;

        node.fx = point.x;
        node.fy = point.y;
        simulation.current?.alphaTarget(DRAG_HEAT);
        wake();
    }, [nodes, wake]);

    const release = useCallback((index: number) => {
        const node = nodes[index];
        if (!node) return;

        node.fx = null;
        node.fy = null;
        simulation.current?.alphaTarget(0);
        wake();
    }, [nodes, wake]);

    return { points, settled, grab, dragTo, release };
}
