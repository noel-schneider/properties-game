import './Sky.css'

function stillSky(): boolean {
    return typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The background: the game's own indigo, with a sunrise coming up behind the
 * board.
 *
 * Deliberately only this. The halo breathes on a slow CSS animation and
 * nothing else moves — the board rebuilds its whole SVG on every frame while
 * it settles, and it locked the browser up outright at 126 bubbles, so the
 * background gets no render budget at all.
 */
function Sky() {
    return (
        <div className="sky" data-still={String(stillSky())} aria-hidden="true">
            <span className="sky__glow sky__glow--core" />
            <span className="sky__glow sky__glow--spill" />
        </div>
    );
}

export default Sky;
