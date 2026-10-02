import { useMemo, useRef, useState } from 'react'
import './Graph.css'
import { useBubbleLayout, VIEW_HEIGHT, VIEW_WIDTH } from './useBubbleLayout'
import type { Point, Tie } from './useBubbleLayout'
import { useTranslator } from './i18n'
import { donePropertiesOf, isSpent, progressOf } from './game'
import type { Solution } from './hand'
import type { Concept } from './types'

const RADIUS = 62;

/** A concept with nothing left to find takes a third of the room. */
const FINISHED_RADIUS = Math.round(62 * 0.34);

/** Space the group's name needs, and how close it may come to the frame. */
const LABEL_GAP = 28;
const LABEL_MARGIN = 14;

/** Past this much travel the gesture is a drag, and must not also select. */
const DRAG_THRESHOLD = 4;

interface GraphProps {
    concepts: Concept[];
    /** Every concept the game knows, to tell a stranded property from an open one. */
    pool?: Concept[];
    selected: string[];
    /** Every group found so far, drawn linked. */
    found: Solution[];
    onToggle: (name: string) => void;
}

/**
 * The outline of a found group: its three members joined by straight sides.
 *
 * One closed shape rather than a spoke from each member to the middle. Three
 * lines meeting at a bare point read as a wiring diagram, and the point itself
 * stands for nothing the player can see.
 *
 * The members are taken in the order they sit around the middle, or the shape
 * crosses itself whenever the simulation moves one past another.
 */
export function groupOutline(places: Point[], centre: Point): string {
    const corners = [...places].sort(
        (a, b) => Math.atan2(a.y - centre.y, a.x - centre.x) - Math.atan2(b.y - centre.y, b.x - centre.x),
    );

    const steps = corners.map((corner) => `L ${corner.x.toFixed(2)} ${corner.y.toFixed(2)}`);
    return `M ${corners[0].x.toFixed(2)} ${corners[0].y.toFixed(2)} ${steps.slice(1).join(' ')} Z`;
}

interface Gesture {
    index: number;
    startedAt: Point;
    moved: boolean;
}

function Graph({ concepts, pool = concepts, selected, found, onToggle }: GraphProps) {
    const { concept: conceptName, property: propertyName, t } = useTranslator();
    const svg = useRef<SVGSVGElement>(null);
    const gesture = useRef<Gesture | null>(null);

    const index = useMemo(
        () => new Map(concepts.map((concept, i) => [concept.name, i])),
        [concepts],
    );

    // Every member of a found group is tied to the first, which gathers them
    // without pinning them into a rigid shape.
    // Only groups still touching the board are drawn. A group whose members
    // have all left or finished has nothing left to say, and every tie kept is
    // another line rebuilt on every frame.
    const live = useMemo(
        () => found.filter((group) => group.concepts.some((name) => index.has(name))),
        [found, index],
    );

    const ties = useMemo<Tie[]>(
        () =>
            live.flatMap((group) =>
                group.concepts
                    .slice(1)
                    .map((name) => ({ from: index.get(group.concepts[0]) ?? -1, to: index.get(name) ?? -1 }))
                    .filter((tie) => tie.from >= 0 && tie.to >= 0),
            ),
        [found, index],
    );

    const radii = useMemo(
        () => concepts.map((concept) => (isSpent(concept, found, pool) ? FINISHED_RADIUS : RADIUS)),
        [concepts, found, pool],
    );

    const { points, settled, grab, dragTo, release } = useBubbleLayout(concepts, radii, ties);

    const [hovered, setHovered] = useState<string | null>(null);

    /**
     * What a concept has been used for. Only found categories: a concept's
     * other properties are the answers the player is still working out, and
     * nothing drawn on the board may hand those over.
     */
    const settledOf = useMemo(
        () => new Map(concepts.map((c) => [c.name, donePropertiesOf(c.name, found)])),
        [concepts, found],
    );

    /**
     * Everything sharing a found category with whatever the player is pointing
     * at or has tabbed to. Empty when that concept has settled nothing, so a
     * kinship of none does not dim the whole board to say so.
     */
    const kin = useMemo(() => {
        if (hovered === null) return new Set<string>();

        const shared = settledOf.get(hovered) ?? [];
        if (shared.length === 0) return new Set<string>();

        return new Set(
            concepts
                .filter((c) => (settledOf.get(c.name) ?? []).some((p) => shared.includes(p)))
                .map((c) => c.name),
        );
    }, [hovered, concepts, settledOf]);

    // A concept is done when every property it has was part of a found group.
    const done = useMemo(
        () => new Set(concepts.filter((c) => isSpent(c, found, pool)).map((c) => c.name)),
        [concepts, found, pool],
    );

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

    const onPointerDown = (i: number) => (event: React.PointerEvent<SVGGElement>) => {
        if (event.button !== 0) return;

        gesture.current = { index: i, startedAt: { x: event.clientX, y: event.clientY }, moved: false };
        event.currentTarget.setPointerCapture?.(event.pointerId);
        grab(i);
    };

    const onPointerMove = (event: React.PointerEvent<SVGGElement>) => {
        const held = gesture.current;
        if (!held) return;

        const travelled = Math.hypot(
            event.clientX - held.startedAt.x,
            event.clientY - held.startedAt.y,
        );
        if (travelled > DRAG_THRESHOLD) held.moved = true;

        // Below the threshold this is a click, not a drag. Dragging stirs the
        // whole simulation, and no human presses a bubble without the pointer
        // shifting a pixel or two — so acting on that wobble would reheat the
        // board on every click, which reads as the board refreshing itself.
        if (!held.moved) return;

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

    const at = (name: string): Point => points[index.get(name) ?? -1] ?? { x: 0, y: 0 };

    return (
        <svg
            ref={svg}
            className="graph"
            data-settled={settled}
            viewBox={`${-VIEW_WIDTH / 2} ${-VIEW_HEIGHT / 2} ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            role="group"
            aria-label={t('graph.label')}
        >
            <defs>
                {/* The loops take their colours from the sunrise behind the
                    board, so a found group looks lit by the same light. */}
                <linearGradient id="found-loop" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffc38c" />
                    <stop offset="55%" stopColor="#ffad69" />
                    <stop offset="100%" stopColor="#e46a92" />
                </linearGradient>
            </defs>
            {live.map((group, groupIndex) => {
                // Ties stay for every group. Names do not: at twenty groups the
                // labels pile into an unreadable heap, so only the group just
                // found says what it was.
                const named = groupIndex === live.length - 1;
                const places = group.concepts.map(at);
                const centre = {
                    x: places.reduce((sum, p) => sum + p.x, 0) / places.length,
                    y: places.reduce((sum, p) => sum + p.y, 0) / places.length,
                };
                const furthest = Math.max(
                    ...places.map((p) => Math.hypot(p.x - centre.x, p.y - centre.y)),
                );

                // Below the group where there is room, above it where there is
                // not: a name that falls off the frame names nothing.
                const edge = VIEW_HEIGHT / 2 - LABEL_MARGIN;
                const below = centre.y + furthest + RADIUS + LABEL_GAP;
                const above = centre.y - furthest - RADIUS - LABEL_GAP / 2;
                const labelY = Math.max(-edge, Math.min(below <= edge ? below : above, edge));
                const labelX = Math.max(
                    -(VIEW_WIDTH / 2 - LABEL_MARGIN),
                    Math.min(centre.x, VIEW_WIDTH / 2 - LABEL_MARGIN),
                );

                return (
                    <g key={`${group.property}-${groupIndex}`} className="found" data-group={group.property}>
                        <path
                            className={named ? 'found__loop found__loop--latest' : 'found__loop'}
                            d={groupOutline(places, centre)}
                        />
                        {named && <text
                            className="found__label"
                            x={labelX}
                            y={labelY}
                            textAnchor="middle"
                        >
                            {propertyName(group.property)}
                        </text>}
                    </g>
                );
            })}

            {concepts.map((concept, i) => {
                const { x, y } = points[i] ?? { x: 0, y: 0 };
                const isDone = done.has(concept.name);
                const { done: spent, total } = progressOf(concept, found);
                const radius = radii[i];
                const isSelected = selected.includes(concept.name);

                const classes = ['bubble'];
                if (isDone) classes.push('bubble--done');
                else if (isSelected) classes.push('bubble--selected');
                if (kin.has(concept.name)) classes.push('bubble--kin');
                else if (kin.size > 0) classes.push('bubble--aside');

                return (
                    <g
                        key={concept.name}
                        className={classes.join(' ')}
                        transform={`translate(${x}, ${y})`}
                        data-found={String(isDone)}
                        data-progress={`${spent}/${total}`}
                        onPointerEnter={() => setHovered(concept.name)}
                        onPointerLeave={() => setHovered((current) => (current === concept.name ? null : current))}
                        onFocus={() => setHovered(concept.name)}
                        onBlur={() => setHovered((current) => (current === concept.name ? null : current))}
                        aria-label={conceptName(concept.name)}
                        {...(isDone
                            ? // A found concept is no longer a choice, so it stops
                              // being offered as one.
                              { role: 'img' as const }
                            : {
                                  role: 'checkbox' as const,
                                  'aria-checked': isSelected,
                                  tabIndex: 0,
                                  onPointerDown: onPointerDown(i),
                                  onPointerMove,
                                  onPointerUp,
                                  onPointerCancel: onPointerUp,
                                  onClick: onClick(concept.name),
                                  onKeyDown: (e: React.KeyboardEvent) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                          e.preventDefault();
                                          onToggle(concept.name);
                                      }
                                  },
                              })}
                    >
                        <circle r={radius} />
                        {!isDone && (
                            <text textAnchor="middle" dominantBaseline="middle">
                                {conceptName(concept.name)}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}

export default Graph;
