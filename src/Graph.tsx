import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './Graph.css'
import { useBubbleLayout, VIEW_HEIGHT, VIEW_WIDTH } from './useBubbleLayout'
import type { Point, Tie } from './useBubbleLayout'
import { useTranslator } from './i18n'
import { donePropertiesOf, isSpent, liveProperties, progressOf } from './game'
import { groupUnderPointer } from './drop'
import { spreadLabels } from './labels'
import { aroundTheMiddle, fannedSides, pathOf } from './loops'
import { arcDash, coloursEverything, huesFor, MARK_START, marksOf, ringRadius } from './reveal'
import type { Reveal } from './reveal'
import type { Solution } from './hand'
import type { Concept } from './types'

const RADIUS = 62;

/**
 * How long the hand has to be still before the board decides nobody is
 * watching and lets the water take over.
 *
 * Twenty seconds is past any pause inside a turn — reading the board, typing
 * a word — and well short of the time it takes to wonder whether the page has
 * frozen.
 */
export const IDLE_AFTER = 20_000;

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
 * How long a concept must be held still before the board tells you what it
 * shares.
 *
 * A finger never hovers, so on a touchscreen the reveal was unreachable: a tap
 * selects and nothing else happens. Holding is the gesture nothing else uses —
 * a tap is shorter, a drag moves — and it is what a phone already means by
 * "tell me more about this".
 */
export const LONG_PRESS = 400;

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
    /** Concepts dealt onto the board by the last answer, marked while new. */
    arriving?: string[];
    /** Two concepts the board is nudging a stalled player towards. */
    hinted?: string[];
    /**
     * Which marks the reveal wears while a concept is pointed at. Several of
     * them exist to be compared side by side before one is kept; the switch
     * is in the developer panel and goes with it.
     */
    reveal?: Reveal;
    onToggle: (name: string) => void;
    /**
     * Asked for when a click lands on the board rather than on a concept.
     *
     * The board is the one place on the page where "nothing" is a thing a
     * player can point at, which makes it the obvious way to put a selection
     * back — and the first thing a tester reached for.
     */
    onClear?: () => void;
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
/**
 * About how wide one character of a category's name is drawn.
 *
 * Poppins semibold at 19px with 0.04em of tracking. An estimate rather than a
 * measurement because the names have to be spread on every frame while the
 * board settles, and measuring text means a layout pass for each one. It is
 * used to decide whether two names overlap, where being a few pixels out costs
 * nothing.
 */
const CHARACTER_WIDTH = 11.5;


/**
 * Takes or gives back the pointer, without letting a refusal end the gesture.
 *
 * Releasing a pointer the element does not hold throws, and the throw used to
 * take the rest of the handler with it — the bubble stayed pinned under a
 * finger that had left, and the board stayed stepped back. Capture is a
 * convenience here, not something the gesture depends on.
 */
function capture(element: Element, pointerId: number, take: boolean): void {
    try {
        if (take) element.setPointerCapture?.(pointerId);
        else element.releasePointerCapture?.(pointerId);
    } catch {
        // Nothing to do: the gesture works either way.
    }
}

interface Gesture {
    index: number;
    /** Cancels the reveal if the press ends or turns into a drag first. */
    holding?: ReturnType<typeof setTimeout>;
    startedAt: Point;
    /** The bubble is following the pointer. */
    dragging: boolean;
    /** It travelled far enough that the player meant to drag, not to click. */
    moved: boolean;
}

function Graph({ concepts, pool = concepts, selected, found, arriving = [], hinted = [], reveal = 'all-arcs', onToggle, onDropInto, onClear }: GraphProps) {
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

    /**
     * How many properties each concept could still be used for. Worked out
     * once per render rather than per bubble: it walks the whole pool for each
     * one, and the board redraws every frame while it settles.
     */
    const leftToFind = useMemo(
        () => new Map(concepts.map((c) => [c.name, liveProperties(c, found, pool).length])),
        [concepts, found, pool],
    );

    const radii = useMemo(
        () => concepts.map((concept) => (isSpent(concept, found, pool) ? FINISHED_RADIUS : RADIUS)),
        [concepts, found, pool],
    );

    const { points, settled, grab, dragTo, release } = useBubbleLayout(concepts, radii, ties);

    /**
     * The members of the group found last, so the board can answer back when
     * an answer lands. Only the latest: marking every group would leave the
     * whole board flinching for the rest of the game.
     */
    const justFound = useMemo(() => {
        const latest = found[found.length - 1];
        return new Set(latest ? latest.concepts : []);
    }, [found]);

    const [hovered, setHovered] = useState<string | null>(null);

    /**
     * Whether the hand has been still long enough for the board to stop being
     * watched.
     *
     * Two renders per idle spell — one in, one out — rather than anything
     * measured while the pointer moves. What it switches on is a stronger
     * drift in CSS; nothing here is drawn per frame.
     */
    const [idle, setIdle] = useState(false);
    const stillness = useRef<ReturnType<typeof setTimeout> | null>(null);

    const stirred = useCallback(() => {
        setIdle((wasIdle) => (wasIdle ? false : wasIdle));
        if (stillness.current) clearTimeout(stillness.current);
        stillness.current = setTimeout(() => setIdle(true), IDLE_AFTER);
    }, []);

    useEffect(() => {
        stirred();
        return () => {
            if (stillness.current) clearTimeout(stillness.current);
        };
    }, [stirred]);

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

        const name = concepts[i].name;
        gesture.current = {
            index: i,
            startedAt: { x: event.clientX, y: event.clientY },
            dragging: false,
            moved: false,
            holding: setTimeout(() => setHovered(name), LONG_PRESS),
        };
        capture(event.currentTarget, event.pointerId, true);
        grab(i);
    };

    const onPointerMove = (event: React.PointerEvent<SVGGElement>) => {
        const held = gesture.current;
        if (!held) return;

        const travelled = Math.hypot(
            event.clientX - held.startedAt.x,
            event.clientY - held.startedAt.y,
        );
        if (travelled > DRAG_THRESHOLD && !held.dragging) {
            held.dragging = true;
            // A concept in the air answers the same question a held one does:
            // which groups it already belongs to. The wait is over either way.
            clearTimeout(held.holding);
            setHovered(concepts[held.index].name);
        }
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

        clearTimeout(held.holding);
        capture(event.currentTarget, event.pointerId, false);
        release(held.index);

        // A finger that lifts has left the board; a mouse that lifts is still
        // sitting on the bubble, and clearing there would fight the hover.
        if (event.pointerType === 'touch') {
            setHovered((current) => (current === concepts[held.index].name ? null : current));
        }

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

    /**
     * Where a group's members are, skipping the ones that are nowhere.
     *
     * Past twenty finished concepts the oldest leave the board, and the groups
     * they belonged to are left naming members that are not drawn. Asking
     * where those are answered with the middle of the board, so every such
     * group grew a corner pointing at nothing in the centre of the screen.
     */
    const placesOf = (names: string[]): Point[] =>
        names.filter((name) => index.has(name)).map(at);

    /**
     * Which groups say their name: the ones the player is pointing at, and
     * nothing else.
     *
     * Naming them all was tried. A name that left as soon as the next find
     * arrived did throw away the record of a player's own work — but keeping
     * every one of them put the record on top of the board instead. The layout
     * pulls a found group's members together, so the names gather exactly where
     * there is least room for them: ten of them already stack over the bubbles
     * they belong to, and a whole game reaches close to forty, more words than
     * there are bubbles.
     *
     * The record lives in the column down the left, where it costs the board
     * nothing. Here, a name answers a question that was asked.
     *
     * One per category even so: a property can be found again with different
     * members, and a concept in both would otherwise say the same word twice.
     */
    const named = useMemo(() => {
        if (hovered === null) return [];

        const its = settledOf.get(hovered) ?? [];
        if (its.length === 0) return [];

        const perProperty = new Map<string, { group: Solution; where: number }>();
        for (const entry of live) {
            if (its.includes(entry.group.property)) perProperty.set(entry.group.property, entry);
        }

        return [...perProperty.values()];
    }, [live, hovered, settledOf]);

    /**
     * A colour for each category being named, so the word and the three
     * bubbles it is about can be matched by eye.
     *
     * Two names arrive within a few pixels of one another whenever two groups
     * share the concept being pointed at — they share most of their middle
     * too — and two grey words that close together are one smudge. Only the
     * categories on show are coloured: colouring every group found would have
     * the whole board shouting at a question about one concept.
     */
    const near = useMemo(() => new Set(named.map(({ group }) => group.property)), [named]);

    /**
     * Every other category still on the board, named too where the whole
     * board is being coloured. A colour with no word against it is a colour
     * nobody can read.
     */
    const alsoNamed = useMemo(() => {
        if (!coloursEverything(reveal) || named.length === 0) return [];

        const perProperty = new Map<string, { group: Solution; where: number }>();
        for (const entry of live) {
            if (!near.has(entry.group.property)) perProperty.set(entry.group.property, entry);
        }

        return [...perProperty.values()];
    }, [live, named, near, reveal]);

    /** Everything named, the pointed concept's own categories first. */
    const shown = useMemo(() => [...named, ...alsoNamed], [named, alsoNamed]);

    const hues = useMemo(
        () =>
            reveal === 'plain'
                ? new Map<string, string>()
                : // The pointed concept's own first: they take the colours that
                  // are furthest apart, and the rest of the board fills in after.
                  huesFor(shown.map(({ group }) => group.property)),
        [shown, reveal],
    );

    /**
     * The outline of every group still on the board, with the sides two of
     * them share fanned out rather than drawn on top of one another.
     *
     * A concept belongs to several categories, so two groups often hold two
     * of the same three members — and then one of them paints over the
     * other's side and the board says it found one category where it found
     * two.
     */
    const outlines = useMemo(() => {
        const drawn = live
            .map((entry) => ({
                entry,
                corners: aroundTheMiddle(
                    entry.group.concepts
                        .filter((name) => index.has(name))
                        .map((name) => ({ name, at: at(name) })),
                ),
            }))
            // One corner is a point, and a point is not a shape.
            .filter(({ corners }) => corners.length >= 2);

        return fannedSides(drawn.map(({ corners }) => corners)).map((sides, i) => ({
            group: drawn[i].entry.group,
            where: drawn[i].entry.where,
            d: pathOf(sides),
            // The group just found is drawn bright, and is the one the landing
            // animation closes around.
            latest: i === drawn.length - 1,
        }));
    }, [live, index, points]);

    /**
     * The group found last, and where it sits — for the ring the find sends
     * out through the water.
     *
     * Nothing at all before the first find, and nothing for a group whose
     * members have all left the board: a wave out of an empty corner is a
     * wave from nowhere.
     */
    const latestFind = useMemo(() => {
        const latest = found[found.length - 1];
        if (!latest) return null;

        const places = placesOf(latest.concepts);
        if (places.length === 0) return null;

        return {
            places,
            middle: {
                x: places.reduce((sum, p) => sum + p.x, 0) / places.length,
                y: places.reduce((sum, p) => sum + p.y, 0) / places.length,
            },
        };
    }, [found, index, points]);

    return (
        <svg
            ref={svg}
            className="graph"
            data-settled={settled}
            viewBox={`${-VIEW_WIDTH / 2} ${-VIEW_HEIGHT / 2} ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            role="group"
            aria-label={t('graph.label')}
            data-idle={String(idle)}
            onPointerMove={stirred}
            onClick={(event) => {
                // Only a click on the board itself. Every click on a bubble
                // bubbles up to here on its way out, and acting on those would
                // undo each pick with its own event.
                if (event.target === event.currentTarget) onClear?.();
            }}
        >
            <defs>
                {/* Warm, where the water behind the board is cold: a group
                    the player found is the one thing on screen giving off
                    light of its own. */}
                <linearGradient id="found-loop" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffc38c" />
                    <stop offset="55%" stopColor="#ffad69" />
                    <stop offset="100%" stopColor="#e46a92" />
                </linearGradient>
            </defs>
            {outlines.map(({ group, where, d, latest }) => {
                const hue = hues.get(group.property);

                return (
                    <g key={`${group.property}-${where}`} className="found" data-group={group.property}>
                        <path
                            className={latest ? 'found__loop found__loop--latest' : 'found__loop'}
                            d={d}
                            // So the outline can draw itself from end to end
                            // whatever its actual length: see `tighten`.
                            pathLength={1}
                            data-hue={hue}
                            data-near={hue ? String(near.has(group.property)) : undefined}
                            style={hue ? ({ '--hue': hue } as React.CSSProperties) : undefined}
                        />
                    </g>
                );
            })}

            {/*
              * What the last find did to the water: one ring out from the
              * middle of the group, and a stream of air let go by each of
              * the three concepts.
              *
              * Keyed on which find it belongs to, so React replaces the
              * elements rather than keeping the ones it has — a running
              * animation ignores a request to start again, and the second
              * find would land in silence.
              *
              * Drawn before the bubbles, so the ring passes behind them: a
              * wave that crosses in front of the board would be a wave in
              * front of the water.
              */}
            {latestFind && (
                <g className="wake" key={`wake-${found.length}`} data-find={String(found.length)}>
                    <circle
                        className="shock"
                        data-find={String(found.length)}
                        cx={latestFind.middle.x}
                        cy={latestFind.middle.y}
                        r={1}
                    />
                    {latestFind.places.map((place, where) => (
                        <g
                            key={`spout-${where}`}
                            className="spout"
                            style={{ '--spout-delay': `${where * 0.12}s` } as React.CSSProperties}
                            transform={`translate(${place.x}, ${place.y})`}
                        >
                            <circle className="spout__air spout__air--1" r={3} />
                            <circle className="spout__air spout__air--2" r={2} />
                            <circle className="spout__air spout__air--3" r={2.6} />
                        </g>
                    ))}
                </g>
            )}

            {concepts.map((concept, i) => {
                const { x, y } = points[i] ?? { x: 0, y: 0 };
                const isDone = done.has(concept.name);
                const { done: spent, total } = progressOf(concept, found);
                const left = leftToFind.get(concept.name) ?? 0;
                const radius = radii[i];
                const isSelected = selected.includes(concept.name);

                const classes = ['bubble'];
                if (isDone) classes.push('bubble--done');
                else if (isSelected) classes.push('bubble--selected');
                if (justFound.has(concept.name)) classes.push('bubble--just-found');
                // Dealt in by the answer just given. A board of twenty bubbles
                // swallows three more without a word otherwise.
                const isFresh = arriving.includes(concept.name);
                if (isFresh) classes.push('bubble--fresh');
                // Lit for a few seconds when nothing has been found in a while.
                const isHinted = hinted.includes(concept.name);
                if (isHinted) classes.push('bubble--hinted');
                // One category from done, and nothing on the board says so:
                // the gauge is nearly closed and a nearly closed ring looks
                // like every other nearly closed ring.
                if (!isDone && spent > 0 && left === 1) classes.push('bubble--brimming');
                if (kin.has(concept.name)) classes.push('bubble--kin');
                else if (kin.size > 0) classes.push('bubble--aside');
                // Lit while a concept is held over their group, so the offer
                // and the thing it is offering are read in one glance.
                if (aimedAt?.concepts.includes(concept.name)) classes.push('bubble--target');

                /*
                 * The drift, on a layer of its own around the bubble.
                 *
                 * Not on the bubble itself: that carries the transform the
                 * simulation writes on every frame, and a second one here
                 * would overwrite it and throw the concept off the board.
                 * Every figure is worked out from the index rather than
                 * drawn, so a concept keeps the same lazy cycle for the whole
                 * game instead of being handed a new one on every render.
                 */
                const float = {
                    '--float-time': `${7 + ((i * 5) % 7)}s`,
                    '--float-delay': `${-((i * 13) % 19)}s`,
                    '--drift-x': `${(i % 2 === 0 ? 1 : -1) * (4 + (i % 3) * 2.5)}px`,
                    '--drift-y': `${(i % 3 === 0 ? -1 : 1) * (5 + (i % 4) * 2.5)}px`,
                    '--swell': `${0.012 + (i % 3) * 0.006}`,
                    // One concept shivers at a time, which is the difference
                    // between water and a wave machine.
                    '--shiver-delay': `${(i * 17) % 160}s`,
                } as React.CSSProperties;

                return (
                    <g key={concept.name} className="bubble-float" style={float}>
                    <g
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
                        {/*
                          * A ring around whatever has just been dealt in. Both
                          * halves matter: the ring widens and fades, and under
                          * reduced motion, where it does neither, it is still
                          * drawn — a mark that only exists while it moves is no
                          * mark at all for the player who turned motion off.
                          */}
                        {isFresh && <circle className="arrival" r={radius + 4} />}
                        {/*
                          * The nudge wears a ring of its own, outside the
                          * gauge. A thicker outline alone was lost on a board
                          * of twenty bubbles seen all at once — which is
                          * exactly the board a stalled player is staring at.
                          */}
                        {isHinted && <circle className="nudge" r={radius + 13} />}
                        {/*
                          * The gauge fills rather than empties: a concept
                          * nobody has used yet shows nothing at all. Drawn the
                          * other way round, a fresh board wore a full ring on
                          * every bubble, which says nothing and teaches the
                          * player to stop looking.
                          *
                          * Out of what the concept can actually be used for,
                          * not out of everything it holds — a concept with a
                          * property nobody can pair on would otherwise sit
                          * short of full for the rest of the game.
                          */}
                        {!isDone && spent > 0 && (
                            <circle
                                className="gauge"
                                r={radius + 7}
                                strokeDasharray={
                                    `${(2 * Math.PI * (radius + 7) * spent) / (spent + left)} ` +
                                    `${2 * Math.PI * (radius + 7)}`
                                }
                            />
                        )}
                        {/*
                          * The colours of the categories this concept shares
                          * with the one being pointed at — one mark each, so a
                          * bubble in two of them says so twice.
                          *
                          * Outside the gauge and the nudge rather than on
                          * them: all three are rings around the same bubble,
                          * and a player who has to work out which is which is
                          * being asked a question about the board instead of
                          * about the game.
                          *
                          * Not on a finished concept. Its dot is a third of
                          * the size, and a mark nineteen units past its edge
                          * would sit nearer its neighbours than itself.
                          */}
                        {!isDone &&
                            marksOf(reveal) !== null &&
                            (settledOf.get(concept.name) ?? [])
                                .filter((property) => near.has(property))
                                .map((property, slice, shown) => {
                                    const hue = hues.get(property)!;
                                    const style = { '--hue': hue } as React.CSSProperties;

                                    if (marksOf(reveal) === 'rings') {
                                        return (
                                            <circle
                                                key={`ring-${property}`}
                                                className="hue-ring"
                                                r={ringRadius(radius, slice)}
                                                data-hue={hue}
                                                style={style}
                                            />
                                        );
                                    }

                                    const r = radius + MARK_START;
                                    const round = 2 * Math.PI * r;
                                    const { dash, offset } = arcDash(r, shown.length, slice);

                                    return (
                                        <circle
                                            key={`arc-${property}`}
                                            className="hue-arc"
                                            r={r}
                                            data-hue={hue}
                                            style={style}
                                            strokeDasharray={`${dash.toFixed(2)} ${(round - dash).toFixed(2)}`}
                                            strokeDashoffset={offset.toFixed(2)}
                                        />
                                    );
                                })}
                        {/*
                          * The tick: this one has given everything it had.
                          *
                          * Small and pale said nothing — a tester read those
                          * dots as bubbles sitting behind the board rather
                          * than as finished ones. A tick is the one mark
                          * nobody has to be taught, and it fits where a name
                          * never could.
                          */}
                        {isDone && <path className="done-tick" d="M-7 0 l5 5 l9 -11" />}
                        {!isDone && (
                            <text textAnchor="middle" dominantBaseline="middle">
                                {conceptName(concept.name)}
                            </text>
                        )}
                    </g>
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
              * The categories of the concept being pointed at, named over the
              * bubbles.
              *
              * Over them because a tight group would otherwise hide its own
              * name behind its members.
              */}
            {spreadLabels(
                shown.map(({ group }) => {
                    const places = placesOf(group.concepts);
                    return {
                        x: places.reduce((sum, p) => sum + p.x, 0) / places.length,
                        y: places.reduce((sum, p) => sum + p.y, 0) / places.length,
                    };
                }),
                shown.map(({ group }) => propertyName(group.property).length * CHARACTER_WIDTH),
            ).map((middle, i) => {
                const property = shown[i].group.property;
                const hue = hues.get(property);

                return (
                    <text
                        key={`name-${property}`}
                        className="found__label"
                        x={middle.x}
                        y={middle.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        data-property={property}
                        data-hue={hue}
                        data-near={hue ? String(near.has(property)) : undefined}
                        style={hue ? ({ '--hue': hue } as React.CSSProperties) : undefined}
                    >
                        {propertyName(property)}
                    </text>
                );
            })}

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
