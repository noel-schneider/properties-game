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

export interface FormableGroup {
    property: string;
    concepts: string[];
}

/**
 * The groups the board can form right now, read from the developer panel.
 *
 * Working them out from the data is not enough: a property one of the three
 * has already been used for is spent, and the panel is what knows.
 */
export function formableGroupsOnScreen(): FormableGroup[] {
    return [...document.querySelectorAll('[data-testid^=answer-]')].map((entry) => ({
        property: entry.getAttribute('data-testid')!.replace('answer-', ''),
        concepts: entry.querySelectorAll('span')[1].textContent!.split(' · '),
    }));
}
