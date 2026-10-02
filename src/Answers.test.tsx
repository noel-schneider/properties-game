import { screen } from '@testing-library/react'
import Answers from './Answers'
import { renderApp } from './test-utils'
import type { Hand } from './hand'

const hand: Hand = {
  concepts: [],
  solutions: [
    { property: 'biome', concepts: ['jungle', 'desert', 'forest'] },
    { property: 'cold', concepts: ['igloo', 'snow', 'glacier'] },
  ],
  solved: [{ property: 'music', concepts: ['piano', 'guitar', 'drum'] }],
};

test('lists the categories still to be found, with their concepts', () => {
  renderApp(<Answers hand={hand} enabled />);

  const panel = screen.getByTestId('answers');
  expect(panel).toHaveTextContent('biome');
  expect(panel).toHaveTextContent('jungle');
  expect(panel).toHaveTextContent('desert');
  expect(panel).toHaveTextContent('forest');
  expect(panel).toHaveTextContent('cold');
});

test('marks the ones already found rather than hiding them', () => {
  renderApp(<Answers hand={hand} enabled />);

  expect(screen.getByTestId('answer-music')).toHaveAttribute('data-found', 'true');
  expect(screen.getByTestId('answer-biome')).toHaveAttribute('data-found', 'false');
});

test('names things in the language being played', () => {
  renderApp(<Answers hand={hand} enabled />);

  // 'biome' is answered as 'nature' in French; English is what this renders in.
  expect(screen.getByTestId('answer-biome')).toHaveTextContent('biome');
});

test('is not rendered at all when it is not wanted', () => {
  renderApp(<Answers hand={hand} enabled={false} />);

  expect(screen.queryByTestId('answers')).toBeNull();
});
