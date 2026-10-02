import { render } from '@testing-library/react'
import Graph from './Graph'
import { LanguageProvider } from './i18n'
import { DEFAULT_LOOK, LOOKS } from './bubbleLooks'
import type { Concept } from './types'

const concepts: Concept[] = [
  { name: 'bee', properties: ['insect', 'small'] },
  { name: 'ant', properties: ['insect', 'small'] },
  { name: 'owl', properties: ['night'] },
];

function board(look?: string) {
  return render(
    <LanguageProvider>
      <Graph concepts={concepts} selected={[]} found={[]} onToggle={() => {}} look={look} />
    </LanguageProvider>,
  );
}

test('the board wears the look it was given', () => {
  board(LOOKS[2].id);

  expect(document.querySelector('.graph')).toHaveAttribute('data-look', LOOKS[2].id);
});

test('without being told, it wears the standing look', () => {
  board();

  expect(document.querySelector('.graph')).toHaveAttribute('data-look', DEFAULT_LOOK);
});

test('the standing look is one that exists', () => {
  // DEFAULT_LOOK is spelled out rather than read from the array, so that the
  // array stays out of the built game. This is what keeps the two in step.
  expect(LOOKS.map((look) => look.id)).toContain(DEFAULT_LOOK);
});

test('every look on the bench has a rule, so none of the buttons does nothing', () => {
  const styles = [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules].map((rule) => rule.cssText))
    .join(' ');

  for (const look of LOOKS.slice(1)) {
    expect(styles).toContain(`[data-look="${look.id}"]`);
  }
});
