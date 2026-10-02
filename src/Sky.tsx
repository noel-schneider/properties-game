import { useEffect, useRef } from 'react'
import './Sky.css'
import { paletteOf } from './sky/palettes'

function stillSky(): boolean {
    return typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface SkyProps {
    /** Which palette to wear. */
    palette: string;
}

/**
 * The background: three wide washes of light drifting over a near-black sky.
 *
 * Everything here moves by composited transform on a fixed layer, driven by a
 * custom property this component writes by hand. Nothing in it goes through
 * React state — the board already rebuilds its whole SVG on every frame while
 * it settles, and it locked the browser up outright at 126 bubbles, so a
 * background that asked for renders of its own would cost the game its frames.
 */
function Sky({ palette }: SkyProps) {
    const sky = useRef<HTMLDivElement>(null);
    const still = stillSky();
    const colours = paletteOf(palette);

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
            // -1 at one edge, 1 at the other, so the stylesheet only needs a distance.
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
        <div
            ref={sky}
            className="sky"
            data-palette={palette}
            data-still={String(still)}
            aria-hidden="true"
            style={{
                '--sky-top': colours.sky,
                '--sky-deep': colours.deep,
                '--wash-one': colours.washes[0].rgb,
                '--wash-one-alpha': colours.washes[0].alpha,
                '--wash-two': colours.washes[1].rgb,
                '--wash-two-alpha': colours.washes[1].alpha,
                '--wash-three': colours.washes[2].rgb,
                '--wash-three-alpha': colours.washes[2].alpha,
            } as React.CSSProperties}
        >
            <div className="sky__aurora">
                <span className="sky__wash sky__wash--one" />
                <span className="sky__wash sky__wash--two" />
                <span className="sky__wash sky__wash--three" />
            </div>
        </div>
    );
}

export default Sky;
