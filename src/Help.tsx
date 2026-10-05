import { useEffect, useState } from 'react'
import './Help.css'
import { loadGreeted, saveGreeted } from './greeting'
import { useTranslator } from './i18n'
import type { UiKey } from './i18n'

/**
 * The gestures the board does not announce.
 *
 * Each is drawn as well as written: "drag a concept onto a group already
 * found" is a sentence nobody reads and a picture everybody does.
 */
export const LESSONS: { id: string; wording: UiKey; draw: () => React.ReactNode }[] = [
    {
        id: 'group',
        wording: 'help.group',
        draw: () => (
            <>
                <circle className="help__bubble help__bubble--picked" cx="14" cy="16" r="9" />
                <circle className="help__bubble help__bubble--picked" cx="32" cy="12" r="9" />
                <circle className="help__bubble help__bubble--picked" cx="26" cy="31" r="9" />
                <circle className="help__bubble" cx="50" cy="26" r="9" />
            </>
        ),
    },
    {
        id: 'gauge',
        wording: 'help.gauge',
        draw: () => (
            <>
                {/* The same concept twice, early and late: the ring is the one
                    mark on the board that means nothing until it has moved. */}
                <circle className="help__bubble" cx="16" cy="24" r="9" />
                <circle
                    className="help__gauge"
                    cx="16"
                    cy="24"
                    r="12.5"
                    strokeDasharray="16 78.5"
                    transform="rotate(-90 16 24)"
                />
                <path className="help__stroke help__stroke--dashed" d="M33 24 h7" />
                <path className="help__stroke" d="M37 20 l4 4 l-4 4" />
                <circle className="help__bubble" cx="50" cy="24" r="9" />
                <circle
                    className="help__gauge help__gauge--full"
                    cx="50"
                    cy="24"
                    r="12.5"
                    strokeDasharray="66 78.5"
                    transform="rotate(-90 50 24)"
                />
            </>
        ),
    },
    {
        id: 'enter',
        wording: 'help.enter',
        draw: () => (
            <>
                <rect className="help__box" x="6" y="12" width="40" height="18" rx="5" />
                <path className="help__stroke" d="M50 16 v7 a3 3 0 0 1 -3 3 h-9" />
                <path className="help__stroke" d="M41 23 l-3 3 l3 3" />
            </>
        ),
    },
    {
        id: 'reveal',
        wording: 'help.reveal',
        draw: () => (
            <>
                <circle className="help__bubble help__bubble--lit" cx="20" cy="21" r="10" />
                <circle className="help__bubble help__bubble--lit" cx="46" cy="14" r="8" />
                <circle className="help__bubble help__bubble--faint" cx="48" cy="33" r="8" />
                {/* The board's own cursor, so the picture points with the
                    thing the player is holding. */}
                <path
                    className="help__spark"
                    d="M30 26 C31.1 31.2 33.4 33.5 38.6 34.6 C33.4 35.7 31.1 38 30 43.2
                       C28.9 38 26.6 35.7 21.4 34.6 C26.6 33.5 28.9 31.2 30 26 Z"
                />
            </>
        ),
    },
    {
        id: 'join',
        wording: 'help.join',
        draw: () => (
            <>
                <path className="help__tie" d="M34 10 L52 20 L38 32 Z" />
                <circle className="help__bubble" cx="34" cy="10" r="6" />
                <circle className="help__bubble" cx="52" cy="20" r="6" />
                <circle className="help__bubble" cx="38" cy="32" r="6" />
                <circle className="help__bubble help__bubble--picked" cx="12" cy="22" r="8" />
                <path className="help__stroke help__stroke--dashed" d="M20 22 h12" />
                <path className="help__stroke" d="M28 18 l5 4 l-5 4" />
            </>
        ),
    },
];

/**
 * How to play, behind a question mark.
 *
 * Opens on a pointer and on a click both. Hover alone would put it out of
 * reach of a finger, which is the hole the board's own reveal had until it was
 * measured and fixed.
 */
function Help() {
    const { t } = useTranslator();
    // Pinned open for somebody arriving for the first time: four gestures the
    // board cannot announce on its own, said once. Pinned rather than merely
    // open, because the panel normally follows the pointer and shuts the
    // moment it leaves — a greeting that vanishes before it is read is no
    // greeting at all.
    const [greeting, setGreeting] = useState(() => !loadGreeted());
    const [open, setOpen] = useState(false);

    const done = () => {
        saveGreeted();
        setGreeting(false);
        setOpen(false);
    };

    // On the document, not on the sheet: the pointer opens this without ever
    // giving it focus, so a key pressed afterwards lands nowhere near it.
    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            if (greeting) done();
            else setOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, greeting]);

    const lessons = (
        <ul className="help__lessons">
            {LESSONS.map((lesson) => (
                <li key={lesson.id} className="help__lesson">
                    <svg className="help__drawing" viewBox="0 0 62 48" aria-hidden="true">
                        {lesson.draw()}
                    </svg>
                    <span className="help__words">{t(lesson.wording)}</span>
                </li>
            ))}
        </ul>
    );

    return (
        <>
            {/*
              * The first arrival gets the middle of the screen, not a corner:
              * the rules are the only thing to read at that moment, and a panel
              * hanging off a question mark reads as a tooltip somebody opened
              * by accident. Afterwards the same lessons live in that corner for
              * the rest of the game.
              */}
            {greeting && (
                <div className="greeting" role="dialog" aria-modal="true" aria-label={t('help.open')}>
                    <div className="greeting__card">
                        <p className="greeting__welcome">{t('help.welcome')}</p>
                        {lessons}
                        <button type="button" className="control greeting__start" onClick={done}>
                            {t('help.start')}
                        </button>
                    </div>
                </div>
            )}

            <div
                className="help"
                onPointerEnter={() => { if (!greeting) setOpen(true); }}
                onPointerLeave={() => { if (!greeting) setOpen(false); }}
            >
                <button
                    type="button"
                    className={open && !greeting ? 'control control--icon control--on' : 'control control--icon'}
                    aria-label={t('help.open')}
                    aria-expanded={open && !greeting}
                    onClick={() => (greeting ? done() : setOpen((shown) => !shown))}
                    onFocus={() => { if (!greeting) setOpen(true); }}
                >
                    <span aria-hidden="true">?</span>
                </button>

                {open && !greeting && (
                    <div className="help__sheet" role="dialog" aria-label={t('help.open')}>
                        {lessons}
                    </div>
                )}
            </div>
        </>
    );
}

export default Help;
