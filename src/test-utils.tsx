import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { LanguageProvider } from './i18n'
import type { Language } from './i18n'
import en from './i18n/en.json'
import fr from './i18n/fr.json'

/** Renders inside a language, since every component reads its strings from one. */
export function renderIn(language: Language, ui: ReactElement) {
    return render(<LanguageProvider initial={language}>{ui}</LanguageProvider>);
}

/** Renders in English, which is what most tests assert against. */
export function renderApp(ui: ReactElement) {
    const result = renderIn('en', ui);
    return {
        ...result,
        // Re-rendering has to keep the provider, or the component loses its strings.
        rerender: (next: ReactElement) =>
            result.rerender(<LanguageProvider initial="en">{next}</LanguageProvider>),
    };
}

export const words = { en, fr };
