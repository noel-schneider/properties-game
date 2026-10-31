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
 * How many bodies of light hang in the deep.
 *
 * Three very large, very soft gradients drifting over one another, in hues
 * close enough to be one colour and far enough apart to keep the water from
 * reading as a flat wash. This is what replaced a tiled fractal-noise
 * texture: noise is what a generated image looks like, however it is tinted,
 * and no amount of it is ever mistaken for water.
 */
export const BLOOMS = 3;

/**
 * How many flakes of marine snow sink through the water.
 *
 * Enough that the eye stops counting them and starts reading the water as
 * full of something. Each is one element the compositor holds and moves on
 * its own; none of them touches a render.
 */
export const MOTES = 24;

/**
 * How many specks of plankton flare in the dark.
 *
 * Each is lit for a fifth of its cycle at most, so at any moment only two or
 * three are glowing — enough to say something down here is alive.
 */
export const PLANKTON = 14;

/**
 * The background: deep water, with the surface somewhere far above the board.
 *
 * Nearly still on purpose. The board rebuilds its whole SVG on every frame
 * while it settles, and it locked the browser up outright at 126 bubbles, so
 * the background gets no render budget at all: everything here is a transform
 * or an opacity on a layer the compositor already holds, started once and
 * left alone.
 *
 * It also rules out the obvious way to draw moving water, which is just as
 * well: a `feTurbulence` texture was tried and is the thing that made the
 * background look generated. What is here instead is light rather than
 * texture — a few very large gradients drifting over one another — and it
 * costs less than the noise did.
 *
 * The one thing driven from the game is the music. When a chord lands the
 * light from the surface swells once and settles, which is a single class
 * change every nine seconds rather than anything measured per frame: the game
 * writes the music, so it is told when a chord starts rather than listening
 * for one. The swell deepens as the orchestra grows, so a game played to the
 * end is lit a little more brightly than one just begun.
 */
interface SkyProps {
    /**
     * How far the game has got, from nothing to everything, drawn as how far
     * the surface has come down to meet it.
     *
     * A hundred concepts is a long game and the number at the top of the
     * screen is a poor way to feel it. The water is a better one: you start
     * as deep as the game goes and you finish in the light.
     */
    risen?: number;
}

function Sky({ risen = 0 }: SkyProps) {
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
     * Where each flake starts, how long it takes to fall and how far it
     * wanders on the way.
     *
     * Settled once rather than drawn fresh: a new set on every render would
     * have the whole water jump every time a chord lands. Spread by index
     * rather than at random, so no two of them ever fall in formation —
     * which is the one thing drifting debris never does.
     */
    const motes = useMemo(
        () =>
            Array.from({ length: MOTES }, (_, i) => ({
                left: ((i * 37) % 100) + (i % 3),
                delay: -((i * 41) % 58),
                rise: 30 + ((i * 7) % 31),
                drift: (i % 2 === 0 ? 1 : -1) * (2 + (i % 5) * 1.5),
                size: 1.6 + (i % 4) * 0.9,
                dim: 0.22 + (i % 4) * 0.1,
            })),
        [],
    );

    /**
     * Where each speck of plankton hangs, and when it flares.
     *
     * Kept out of the floor and away from the very top, and spread by index
     * for the same reason as the snow.
     */
    const sparks = useMemo(
        () =>
            Array.from({ length: PLANKTON }, (_, i) => ({
                left: (i * 53) % 97 + 1.5,
                top: 14 + ((i * 29) % 66),
                cycle: 9 + ((i * 5) % 13),
                delay: -((i * 3.7) % 17) - i * 0.31,
                size: 7 + (i % 3) * 3,
                dim: 0.45 + (i % 4) * 0.13,
            })),
        [],
    );

    return (
        <div
            className="sky"
            ref={water}
            data-still={String(stillSky())}
            aria-hidden="true"
            // Clamped here rather than trusted: this is a count divided by
            // another count, and a fraction over one reaching the gradient
            // does nothing good to it.
            style={{ '--risen': String(Math.min(Math.max(risen, 0), 1)) } as React.CSSProperties}
        >
            <div className="sky__deep">
                {Array.from({ length: BLOOMS }, (_, i) => (
                    <span key={i} className={`sky__bloom sky__bloom--${i + 1}`} />
                ))}
            </div>

            {/*
              * Something small with a light of its own, every few minutes.
              *
              * Never explained and never acknowledged by the game. It costs
              * one element and one very slow animation, and it is the detail
              * people tell each other about.
              */}
            <div className="sky__passer" />

            {/* Where the light comes in, glowing through the surface. */}
            <div className="sky__sun" />

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

            {/* The sea floor, only just made out. */}
            <div className="sky__floor" />

            <div className="sky__glow">
                {sparks.map((spark, i) => (
                    <span
                        key={i}
                        className="sky__spark"
                        style={{
                            '--spark-left': `${spark.left}%`,
                            '--spark-top': `${spark.top}%`,
                            '--spark-cycle': `${spark.cycle}s`,
                            '--spark-delay': `${spark.delay.toFixed(2)}s`,
                            '--spark-size': `${spark.size}px`,
                            '--spark-dim': String(spark.dim),
                        } as React.CSSProperties}
                    />
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
