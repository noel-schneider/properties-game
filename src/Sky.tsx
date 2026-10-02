import { useEffect, useRef } from 'react'
import './Sky.css'

export interface StarLayer {
    /** How many stars it holds. More of them, the further away they are. */
    count: number;
    /** How far it slides under the pointer, at the frame's edge, in pixels. */
    shift: number;
    /** Smallest and largest star, in pixels. */
    radius: [number, number];
    /** Dimmest and brightest star. */
    opacity: [number, number];
    /** Only the nearest layer breathes: a whole sky blinking at once is a fault light. */
    twinkle: boolean;
}

/**
 * Three depths of sky.
 *
 * Deliberately dim. The board draws its group names in orange and ties them
 * with hairlines, and both have to stay readable over this — a bright sky would
 * win a competition it is not supposed to enter.
 */
export const STAR_LAYERS: StarLayer[] = [
    { count: 90, shift: 4, radius: [0.5, 1], opacity: [0.18, 0.38], twinkle: false },
    { count: 46, shift: 11, radius: [0.8, 1.5], opacity: [0.3, 0.55], twinkle: false },
    { count: 22, shift: 24, radius: [1.2, 2.1], opacity: [0.45, 0.8], twinkle: true },
];

interface Star {
    x: number;
    y: number;
    r: number;
    opacity: number;
    delay: number;
    period: number;
}

/**
 * A small deterministic generator, so the sky is the same on every render and
 * in every screenshot. Math.random would reshuffle the stars whenever React
 * rebuilt the element, which reads as a glitch rather than a sky.
 */
function seeded(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function scatter(layer: StarLayer, seed: number): Star[] {
    const random = seeded(seed);
    const between = (low: number, high: number) => low + random() * (high - low);

    return Array.from({ length: layer.count }, () => ({
        x: between(0, 100),
        y: between(0, 100),
        r: between(layer.radius[0], layer.radius[1]),
        opacity: between(layer.opacity[0], layer.opacity[1]),
        delay: between(0, 6),
        period: between(3.4, 7.2),
    }));
}

/** Built once at module load: the sky never changes, so it is never recomputed. */
const SKY: Star[][] = STAR_LAYERS.map((layer, i) => scatter(layer, 1337 + i * 7919));

function stillSky(): boolean {
    return typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The background: a few wide aurora washes with stars in front of them.
 *
 * Everything here moves by composited transform on a fixed layer, driven by a
 * custom property this component writes by hand. Nothing in it goes through
 * React state — the board already redraws its whole SVG while it settles, and
 * a background that asked for renders of its own would cost the game its frames.
 */
function Sky() {
    const sky = useRef<HTMLDivElement>(null);
    const still = stillSky();

    useEffect(() => {
        if (still) return;

        let frame = 0;
        let x = 0;
        let y = 0;

        const paint = () => {
            frame = 0;
            sky.current?.style.setProperty('--sky-x', x.toFixed(3));
            sky.current?.style.setProperty('--sky-y', y.toFixed(3));
        };

        const follow = (event: PointerEvent) => {
            // -1 at one edge, 1 at the other, so each layer only needs a distance.
            x = (event.clientX / window.innerWidth) * 2 - 1;
            y = (event.clientY / window.innerHeight) * 2 - 1;
            // At most one write per frame, however fast the pointer reports.
            if (frame === 0) frame = requestAnimationFrame(paint);
        };

        window.addEventListener('pointermove', follow, { passive: true });
        return () => {
            window.removeEventListener('pointermove', follow);
            if (frame !== 0) cancelAnimationFrame(frame);
        };
    }, [still]);

    return (
        <div ref={sky} className="sky" data-still={String(still)} aria-hidden="true">
            <div className="sky__aurora">
                <span className="sky__wash sky__wash--one" />
                <span className="sky__wash sky__wash--two" />
                <span className="sky__wash sky__wash--three" />
            </div>

            {SKY.map((stars, i) => (
                <svg
                    key={i}
                    className="sky__stars"
                    style={{ '--shift': `${STAR_LAYERS[i].shift}px` } as React.CSSProperties}
                    data-twinkle={String(STAR_LAYERS[i].twinkle)}
                >
                    {stars.map((star, j) => (
                        <circle
                            key={j}
                            cx={`${star.x}%`}
                            cy={`${star.y}%`}
                            r={star.r}
                            opacity={star.opacity}
                            style={{
                                '--glow': star.opacity,
                                animationDelay: `${star.delay}s`,
                                animationDuration: `${star.period}s`,
                            } as React.CSSProperties}
                        />
                    ))}
                </svg>
            ))}
        </div>
    );
}

export default Sky;
