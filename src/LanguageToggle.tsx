import { useEffect, useRef, useState } from 'react'
import './LanguageToggle.css'
import { LANGUAGES, useTranslator } from './i18n'
import type { Language } from './i18n'

const FLAGS: Record<Language, string> = { en: '🇬🇧', fr: '🇫🇷' };

/**
 * The language, behind the flag already flying.
 *
 * One button among the others rather than one per language: the row of
 * controls is a row of jobs, and "which language" is one job. The rest unfold
 * from it on a pointer — and on a tap and on focus, because hover alone would
 * put this out of reach of a finger, which is the hole the board's own reveal
 * had until it was measured.
 */
function LanguageToggle() {
    const { language, setLanguage, t } = useTranslator();
    const [open, setOpen] = useState(false);
    const box = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        // A finger never leaves, so pointerleave alone would leave this open
        // over the board for the rest of the game.
        const onDown = (event: PointerEvent) => {
            if (!box.current?.contains(event.target as Node)) setOpen(false);
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('pointerdown', onDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('pointerdown', onDown);
        };
    }, [open]);

    return (
        <div
            className="language"
            ref={box}
            onPointerEnter={() => setOpen(true)}
            onPointerLeave={(event) => {
                // Only when the pointer has actually gone somewhere else on the
                // page. A leave with nothing on the other side of it means the
                // pointer left the window, which is no reason to shut a menu —
                // and is what a synthetic click between two of these buttons
                // looks like, which used to unmount the flag mid-press.
                const to = event.relatedTarget as Node | null;
                if (to instanceof Node && !box.current?.contains(to)) setOpen(false);
            }}
        >
            <button
                type="button"
                className={open ? 'control control--icon control--on' : 'control control--icon'}
                onClick={() => setOpen(true)}
                onFocus={() => setOpen(true)}
                aria-label={t('language.group')}
                title={t('language.group')}
                aria-expanded={open}
            >
                <span aria-hidden="true">{FLAGS[language]}</span>
            </button>

            {open && (
                <div className="language__list" role="group" aria-label={t('language.group')}>
                    {LANGUAGES.map((code) => (
                        <button
                            key={code}
                            type="button"
                            className={
                                code === language
                                    ? 'control control--icon control--on'
                                    : 'control control--icon language__flag'
                            }
                            onClick={() => {
                                setLanguage(code);
                                setOpen(false);
                            }}
                            aria-pressed={code === language}
                            // A flag is a country, not a language, so the name
                            // carries the meaning for anyone not reading the
                            // picture.
                            aria-label={t(`language.${code}` as 'language.en' | 'language.fr')}
                            title={t(`language.${code}` as 'language.en' | 'language.fr')}
                        >
                            <span aria-hidden="true">{FLAGS[code]}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default LanguageToggle;
