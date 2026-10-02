import { useMemo } from 'react'
import { forceCenter, forceCollide, forceSimulation, forceX, forceY } from 'd3-force'
import type { Concept } from './types'

export interface Bubble {
    concept: Concept;
    x: number;
    y: number;
}

export interface Layout {
    bubbles: Bubble[];
    /** Bounding box of the laid out bubbles, ready to use as an SVG viewBox. */
    viewBox: string;
}

interface LayoutNode {
    index?: number;
    x?: number;
    y?: number;
}

/**
 * Packs the bubbles into a cluster where none overlap.
 *
 * The simulation is run to completion here rather than animated frame by
 * frame: the positions are only needed once, and a cluster that keeps
 * drifting makes the bubbles impossible to aim at.
 */
export function useBubbleLayout(concepts: Concept[], radius: number): Layout {
    return useMemo(() => {
        const nodes: LayoutNode[] = concepts.map(() => ({}));

        forceSimulation(nodes)
            .force('centerX', forceX(0).strength(0.05))
            .force('centerY', forceY(0).strength(0.05))
            .force('center', forceCenter(0, 0))
            .force('collide', forceCollide(radius + 1).strength(1))
            .stop()
            .tick(400);

        const bubbles = concepts.map((concept, i) => ({
            concept,
            x: nodes[i].x ?? 0,
            y: nodes[i].y ?? 0,
        }));

        // Fit the viewBox to the cluster so that no bubble is ever clipped,
        // whatever the window size.
        const pad = radius + 4;
        const xs = bubbles.map((b) => b.x);
        const ys = bubbles.map((b) => b.y);
        const minX = Math.min(...xs) - pad;
        const minY = Math.min(...ys) - pad;
        const width = Math.max(...xs) + pad - minX;
        const height = Math.max(...ys) + pad - minY;

        return { bubbles, viewBox: `${minX} ${minY} ${width} ${height}` };
    }, [concepts, radius]);
}
