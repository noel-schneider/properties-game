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

/**
 * Pins where the bubbles start, for a test that measures the board.
 *
 * Every bubble is dropped at a random point and the simulation takes it from
 * there (`huddle`, in `useBubbleLayout.ts`), so what a settled board looks
 * like is that draw as much as it is the forces. A test comparing one board
 * against another, or against a threshold, is then comparing two different
 * afternoons: `finished concepts take less room` measured ratios anywhere
 * between 0.42 and 0.69 against a limit of 0.75 — passing, until the draw
 * that did not.
 *
 * Call it before each board a test lays out: it starts the same sequence
 * again every time, which is what makes two of them comparable. Pinned rather
 * than flattened to one spot, because bubbles all started on the same point
 * reach four times the width of the frame before the pull to the middle wins.
 *
 * Restore it with `vi.restoreAllMocks()`, or the next test in the file
 * inherits a `Math.random` that is not random.
 */
export function pinTheScatter(): void {
    // A plain linear congruential generator: any fixed sequence will do, and
    // this one is four lines rather than a dependency.
    let seed = 0x2f6e2b1;
    vi.spyOn(Math, 'random').mockImplementation(() => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 2 ** 32;
    });
}
