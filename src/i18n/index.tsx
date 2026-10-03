import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import en from './en.json'
import fr from './fr.json'

export type Language = 'en' | 'fr';

export const LANGUAGES: Language[] = ['en', 'fr'];

const CATALOGUE = { en, fr } as const;

type Locale = typeof en;
export type UiKey = keyof Locale['ui'];

const STORAGE_KEY = 'properties-game:language';

/**
 * The language the player is most likely to want, before they have said.
 * Their stored choice always wins over this.
 */
export function preferredLanguage(): Language {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'en' || stored === 'fr') return stored;
    } catch {
        // Storage unavailable. Fall through to the browser's own preference.
    }

    const spoken = typeof navigator === 'undefined' ? [] : navigator.languages ?? [navigator.language];
    return spoken.some((tag) => tag?.toLowerCase().startsWith('fr')) ? 'fr' : 'en';
}

function rememberLanguage(language: Language): void {
    try {
        localStorage.setItem(STORAGE_KEY, language);
    } catch {
        // A preference is not worth a crash.
    }
}

export interface Translator {
    language: Language;
    setLanguage: (language: Language) => void;
    /** An interface string. */
    t: (key: UiKey) => string;
    /** The name a concept goes by in this language. */
    concept: (id: string) => string;
    /** The name a category goes by in this language. */
    property: (id: string) => string;
    /** Everything this language accepts as an answer for a category. */
    wordings: Record<string, { label: string; aliases: string[] }>;
    achievement: (id: string) => { name: string; description: string };
}

const TranslatorContext = createContext<Translator | null>(null);

export function LanguageProvider({ children, initial }: { children: ReactNode; initial?: Language }) {
    const [language, setStateLanguage] = useState<Language>(() => initial ?? preferredLanguage());

    // Screen readers and spell checkers go by this, and it is wrong until set.
    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const setLanguage = useCallback((next: Language) => {
        rememberLanguage(next);
        setStateLanguage(next);
    }, []);

    const value = useMemo<Translator>(() => {
        const locale = CATALOGUE[language];

        const wordings = Object.fromEntries(
            Object.entries(locale.properties).map(([id, label]) => [
                id,
                { label, aliases: (locale.aliases as Record<string, string[]>)[id] ?? [] },
            ]),
        );

        return {
            language,
            setLanguage,
            t: (key) => locale.ui[key],
            // Falling back to the id keeps a missing translation readable rather
            // than blank. The locale tests are what stop one existing.
            concept: (id) => (locale.concepts as Record<string, string>)[id] ?? id,
            property: (id) => (locale.properties as Record<string, string>)[id] ?? id,
            wordings,
            achievement: (id) =>
                (locale.achievements as Record<string, { name: string; description: string }>)[id] ?? {
                    name: id,
                    description: '',
                },
        };
    }, [language, setLanguage]);

    return <TranslatorContext.Provider value={value}>{children}</TranslatorContext.Provider>;
}

export function useTranslator(): Translator {
    const translator = useContext(TranslatorContext);
    if (!translator) throw new Error('useTranslator must be used inside a LanguageProvider');
    return translator;
}
