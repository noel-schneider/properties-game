import { useMemo, useRef, useState } from 'react'
import './Graph.css'
import { useBubbleLayout, VIEW_HEIGHT, VIEW_WIDTH } from './useBubbleLayout'
import type { Point, Tie } from './useBubbleLayout'
import { useTranslator } from './i18n'
import { donePropertiesOf, isSpent, progressOf } from './game'
import { groupUnderPointer } from './drop'
import type { Solution } from './hand'
import type { Concept } from './types'

const RADIUS = 62;

/** A concept with nothing left to find takes a third of the room. */
export const FINISHED_RADIUS = Math.round(62 * 0.34);

/** Clear space between a spent concept's dot and the name beside it. */
export const ASIDE_GAP = 9;

/** Room a name beside a dot needs, give or take, for deciding which side. */
const ASIDE_WIDTH = 96;

/**
 * Which side of a spent concept's dot its name goes, and where.
 *
 * A name is kept even though the concept can never join another group: it is
 * what reminds the player which categories are in play while they work on the
 * ones still live. Put beside rather than inside because the dot is a third
 * of the size and nothing legible fits in it.
 */
export function asideLabel(x: number, radius: number): { dx: number; anchor: 'start' | 'end' } {
    const wall = VIEW_WIDTH / 2 - LABEL_MARGIN;
    const fitsRight = x + radius + ASIDE_GAP + ASIDE_WIDTH <= wall;

    return fitsRight
        ? { dx: radius + ASIDE_GAP, anchor: 'start' }
        : { dx: -(radius + ASIDE_GAP), anchor: 'end' };
}

/** How close a label may come to the frame. */
const LABEL_MARGIN = 14;

/** Past this much travel the bubble starts following the pointer. */
const DRAG_THRESHOLD = 4;

/**
 * Past this much travel the gesture was a drag, and must not also select.
 *
 * Deliberately far looser than the distance that starts the drag. Nobody
 * clicks without the pointer slipping a few pixels, and a bubble that quietly
 * refuses to be picked leaves the player staring at an answer that was refused
 * for a reason nothing on screen explains. Moving a bubble a hair and selecting
 * it is a fine outcome; failing to select it is not.
 */
const DRAG_INTENT = 16;

interface GraphProps {
    concepts: Concept[];
    /** Every concept the game knows, to tell a stranded property from an open one. */
    pool?: Concept[];
    selected: string[];
    /** Every group found so far, drawn linked. */
    found: Solution[];
    onToggle: (name: string) => void;
    /**
     * Dropping a concept onto a category already found. The index is into
     * `found`; whether it is a right answer is settled by the game, not here.
     */
    onDropInto?: (index: number, name: string) => void;
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
    /** The bubble is following the pointer. */
    dragging: boolean;
    /** It travelled far enough that the player meant to drag, not to click. */
    moved: boolean;
}

function Graph({ concepts, pool = concepts, selected, found, onToggle, onDropInto }: GraphProps) {
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
        () =>
            found
                .map((group, where) => ({ group, where }))
                .filter(({ group }) => group.concepts.some((name) => index.has(name))),
        [found, index],
    );

    const ties = useMemo<Tie[]>(
        () =>
            live.flatMap(({ group }) =>
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

    // Which found group the dragged bubble is currently over, if any.
    const [over, setOver] = useState<number | null>(null);
    const aimedAt = over === null ? null : found[over] ?? null;

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

        gesture.current = { index: i, startedAt: { x: event.clientX, y: event.clientY }, dragging: false, moved: false };
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
        if (travelled > DRAG_THRESHOLD) held.dragging = true;
        if (travelled > DRAG_INTENT) held.moved = true;

        // Below the threshold this is a click, not a drag. Dragging stirs the
        // whole simulation, and no human presses a bubble without the pointer
        // shifting a pixel or two — so acting on that wobble would reheat the
        // board on every click, which reads as the board refreshing itself.
        if (!held.dragging) return;

        const point = toViewBox(event);
        if (!point) return;

        dragTo(held.index, point);

        // A concept can be added to a category already found by dropping it on
        // that group. Whether it belongs there is not decided here: offering
        // the target only where the answer is right would give the answer away.
        const dragged = concepts[held.index]?.name;
        setOver(
            groupUnderPointer(
                point,
                live
                    .filter(({ group }) => !group.concepts.includes(dragged))
                    .map(({ where, group }) => ({ index: where, places: group.concepts.map(at) })),
            ),
        );
    };

    const onPointerUp = (event: React.PointerEvent<SVGGElement>) => {
        const held = gesture.current;
        if (!held) return;

        event.currentTarget.releasePointerCapture?.(event.pointerId);
        release(held.index);

        const target = over;
        setOver(null);
        if (target !== null && held.moved) {
            onDropInto?.(target, concepts[held.index].name);
        }
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
            {live.map(({ group }, groupIndex) => {
                // Ties stay for every group. Names do not: at twenty groups the
                // labels pile into an unreadable heap, so only the group just
                // found says what it was.
                const named = groupIndex === live.length - 1;
                const places = group.concepts.map(at);
                const centre = {
                    x: places.reduce((sum, p) => sum + p.x, 0) / places.length,
                    y: places.reduce((sum, p) => sum + p.y, 0) / places.length,
                };

                return (
                    <g key={`${group.property}-${groupIndex}`} className="found" data-group={group.property}>
                        <path
                            className={named ? 'found__loop found__loop--latest' : 'found__loop'}
                            d={groupOutline(places, centre)}
                        />
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
                // Lit while a concept is held over their group, so the offer
                // and the thing it is offering are read in one glance.
                if (aimedAt?.concepts.includes(concept.name)) classes.push('bubble--target');

                return (
                    <g
                        key={concept.name}
                        className={classes.join(' ')}
                        transform={`translate(${x}, ${y})`}
                        data-found={String(isDone)}
                        data-progress={`${spent}/${total}`}
                        onPointerEnter={() => setHovered(concept.name)}
                        onPointerLeave={() => setHovered((current) => (current === concept.name ? null : current))}
                        onFocus={(event) => {
                            // Only a focus the browser would draw a ring around.
                            // A mouse click leaves the focus on the bubble it
                            // hit, and treating that as a reveal leaves the
                            // board stepped back for as long as the click
                            // lasts — which is until the next one.
                            //
                            // Reliable here, unlike inside a keydown handler,
                            // where pressing the key has already put the
                            // browser into keyboard modality before the
                            // handler runs. Measured both ways.
                            if (event.currentTarget.matches?.(':focus-visible')) {
                                setHovered(concept.name);
                            }
                        }}
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

            {/*
              * The offer, drawn after everything: it is the one thing on the
              * board that must never be behind a bubble, since it is what the
              * player is reading while deciding whether to let go.
              */}
            {aimedAt && (() => {
                const places = aimedAt.concepts.map(at);
                const middle = {
                    x: places.reduce((sum, p) => sum + p.x, 0) / places.length,
                    y: places.reduce((sum, p) => sum + p.y, 0) / places.length,
                };

                return (
                    <text className="drop-hint" x={middle.x} y={middle.y - 8} textAnchor="middle">
                        {`${t('drop.add')} « ${propertyName(aimedAt.property)} »`}
                    </text>
                );
            })()}

            {/*
              * The name of the group just found, in its middle and over the
              * bubbles.
              *
              * In the middle because that is the thing being named, and the
              * outline has a hole there once a group grows past three. Over
              * the bubbles because a tight group would otherwise hide its own
              * name behind them.
              *
              * Still only the latest: at twenty groups every name drawn is an
              * unreadable heap. Which group is which, for the rest, is what
              * the offer under a dragged concept answers.
              */}
            {live.length > 0 && (() => {
                const group = live[live.length - 1].group;
                const places = group.concepts.map(at);
                const middle = {
                    x: places.reduce((sum, p) => sum + p.x, 0) / places.length,
                    y: places.reduce((sum, p) => sum + p.y, 0) / places.length,
                };

                return (
                    <text className="found__label" x={middle.x} y={middle.y} textAnchor="middle" dominantBaseline="middle">
                        {propertyName(group.property)}
                    </text>
                );
            })()}

            {/*
              * The names of the spent concepts, drawn after every bubble.
              *
              * A spent dot is a third of the size and usually ends up tucked
              * between full-size bubbles, so a name drawn with its own group
              * is painted over by whatever is dealt next to it. Last, it is
              * always readable.
              */}
            {concepts.map((concept, i) => {
                if (!done.has(concept.name)) return null;

                const { x, y } = points[i] ?? { x: 0, y: 0 };
                const aside = asideLabel(x, radii[i]);

                // Drawn outside the bubble groups, so these miss the reveal's
                // dimming unless it is applied to them by hand — and then they
                // are the brightest thing on a board that has just stepped back.
                const muted = kin.size > 0 && !kin.has(concept.name);

                return (
                    <text
                        key={`aside-${concept.name}`}
                        className={
                            muted
                                ? 'bubble__name--aside bubble__name--muted'
                                : 'bubble__name--aside'
                        }
                        x={x + aside.dx}
                        y={y}
                        textAnchor={aside.anchor}
                        dominantBaseline="middle"
                    >
                        {conceptName(concept.name)}
                    </text>
                );
            })}
        </svg>
    );
}

export default Graph;
