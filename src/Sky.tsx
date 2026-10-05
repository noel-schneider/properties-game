import React, { useEffect, useState } from 'react'
import './Sky.css'
import { onChord } from './pulse'

function stillSky(): boolean {
    return typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The background: the game's own indigo, with a sunrise coming up behind the
 * board.
 *
 * Nearly still on purpose. The halo breathes on a slow CSS animation and
 * nothing else moves — the board rebuilds its whole SVG on every frame while
 * it settles, and it locked the browser up outright at 126 bubbles, so the
 * background gets no render budget at all.
 *
 * The one exception is the music. When a chord lands the sunrise swells once
 * and settles, which is a single class change every nine seconds rather than
 * anything measured per frame: the game writes the music, so it is told when a
 * chord starts rather than listening for one. The swell deepens as the
 * orchestra grows, so a game played to the end is lit a little more warmly
 * than one just begun.
 */
function Sky() {
    const [beat, setBeat] = useState(0);
    const [parts, setParts] = useState(0);

    useEffect(() => onChord((playing) => {
        setBeat((count) => count + 1);
        setParts(playing);
    }), []);

    return (
        <div className="sky" data-still={String(stillSky())} aria-hidden="true">
            {/*
              * The swell alternates between two identical animations rather
              * than restarting one: a CSS animation ignores a request to start
              * again while it is running, and remounting the halos instead
              * would restart their own slow breathing every nine seconds and
              * leave it stuck at its opening.
              */}
            <div
                className="sky__pulse"
                data-beat={String(beat)}
                data-parts={String(parts)}
                data-phase={beat % 2 === 0 ? 'a' : 'b'}
                style={{ '--swell': String(Math.min(parts, 5)) } as React.CSSProperties}
            >
                <span className="sky__glow sky__glow--core" />
                <span className="sky__glow sky__glow--spill" />
            </div>
        </div>
    );
}

export default Sky;
