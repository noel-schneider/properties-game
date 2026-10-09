import React, { useEffect, useMemo, useRef, useState } from 'react'
import './Sky.css'
import { onChord } from './pulse'

function stillSky(): boolean {
    return typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * How many shafts of light come down from the surface.
 *
 * One is a spotlight. Three, at different widths and leaning different ways,
 * are light coming through water from somewhere above.
 */
export const SHAFTS = 3;

/**
 * How many motes drift up through the water.
 *
 * Twenty is the number at which the eye stops counting them and starts
 * reading the water as full of something. Each is one element the compositor
 * holds and moves on its own; none of them touches a render.
 */
export const MOTES = 20;

/**
 * The background: deep water, with the surface somewhere far above the board.
 *
 * Nearly still on purpose. The board rebuilds its whole SVG on every frame
 * while it settles, and it locked the browser up outright at 126 bubbles, so
 * the background gets no render budget at all: everything here is a transform
 * or an opacity on a layer the compositor already holds, started once and
 * left alone.
 *
 * That rules out the obvious way to draw moving water. Animating the
 * `feTurbulence` that makes the caustics would be the real thing and would
 * also be a filter recomputed every frame — so the texture is generated once
 * and it is the drift across it that moves.
 *
 * The one thing driven from the game is the music. When a chord lands the
 * light from the surface swells once and settles, which is a single class
 * change every nine seconds rather than anything measured per frame: the game
 * writes the music, so it is told when a chord starts rather than listening
 * for one. The swell deepens as the orchestra grows, so a game played to the
 * end is lit a little more brightly than one just begun.
 */
function Sky() {
    const [beat, setBeat] = useState(0);
    const [parts, setParts] = useState(0);
    const water = useRef<HTMLDivElement>(null);

    /**
     * The water leans the other way from the hand.
     *
     * The one thing on this layer the player drives, and it is written
     * straight to the element: a render of the background on every pointer
     * move is precisely the budget it has never had. The browser already
     * coalesces pointer moves to one per frame, so there is nothing to
     * throttle on top.
     *
     * Away rather than with, and by a few pixels: that is what tells the eye
     * the water is behind the board rather than painted on it.
     */
    useEffect(() => {
        const lean = (event: PointerEvent) => {
            const layer = water.current;
            if (!layer) return;

            layer.style.setProperty('--lean-x', String(0.5 - event.clientX / window.innerWidth));
            layer.style.setProperty('--lean-y', String(0.5 - event.clientY / window.innerHeight));
        };

        window.addEventListener('pointermove', lean);
        return () => window.removeEventListener('pointermove', lean);
    }, []);

    useEffect(() => onChord((playing) => {
        setBeat((count) => count + 1);
        setParts(playing);
    }), []);

    /**
     * Where each mote starts, how long it takes to climb and how far it
     * wanders on the way.
     *
     * Settled once rather than drawn fresh: a new set on every render would
     * have the whole water jump every time a chord lands. Spread by index
     * rather than at random, so no two of them ever climb in formation —
     * which is the one thing drifting plankton never does.
     */
    const motes = useMemo(
        () =>
            Array.from({ length: MOTES }, (_, i) => ({
                left: ((i * 37) % 100) + (i % 3),
                delay: -((i * 41) % 38),
                rise: 18 + ((i * 7) % 23),
                drift: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
                size: 1.4 + (i % 3) * 0.9,
                dim: 0.3 + (i % 4) * 0.12,
            })),
        [],
    );

    return (
        <div className="sky" ref={water} data-still={String(stillSky())} aria-hidden="true">
            <div className="sky__caustics" />

            {/*
              * The swell alternates between two identical animations rather
              * than restarting one: a CSS animation ignores a request to start
              * again while it is running, and remounting the shafts instead
              * would restart their own slow sway every nine seconds and leave
              * it stuck at its opening.
              */}
            <div
                className="sky__pulse"
                data-beat={String(beat)}
                data-parts={String(parts)}
                data-phase={beat % 2 === 0 ? 'a' : 'b'}
                style={{ '--swell': String(Math.min(parts, 5)) } as React.CSSProperties}
            >
                {Array.from({ length: SHAFTS }, (_, i) => (
                    <span key={i} className={`sky__shaft sky__shaft--${i + 1}`} />
                ))}
            </div>

            <div className="sky__drift">
                {motes.map((mote, i) => (
                    <span
                        key={i}
                        className="sky__mote"
                        style={{
                            '--mote-left': `${mote.left}%`,
                            '--rise-delay': `${mote.delay}s`,
                            '--rise-time': `${mote.rise}s`,
                            '--mote-drift': `${mote.drift}vw`,
                            '--mote-size': `${mote.size}px`,
                            '--mote-dim': String(mote.dim),
                        } as React.CSSProperties}
                    />
                ))}
            </div>
        </div>
    );
}

export default Sky;
