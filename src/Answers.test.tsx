import { screen } from '@testing-library/react'
import Answers from './Answers'
import { renderApp } from './test-utils'
import { getAllConcepts } from './concepts'

const pool = getAllConcepts();
const board = ['jungle', 'desert', 'forest', 'igloo', 'snow', 'glacier'];

test('lists the categories still to be found, with their concepts', () => {
  renderApp(<Answers board={board} pool={pool} found={[]} enabled />);

  const panel = screen.getByTestId('answers');
  expect(panel).toHaveTextContent('biome');
  expect(panel).toHaveTextContent('jungle');
  expect(panel).toHaveTextContent('desert');
  expect(panel).toHaveTextContent('forest');
  expect(panel).toHaveTextContent('cold');
});

test('a group that can no longer be formed stops being listed', () => {
  const spent = [{ property: 'biome', concepts: ['jungle', 'desert', 'forest'] }];
  renderApp(<Answers board={board} pool={pool} found={spent} enabled />);

  expect(screen.queryByTestId('answer-biome')).toBeNull();
  expect(screen.getByTestId('answer-cold')).toBeInTheDocument();
});

test('names things in the language being played', () => {
  renderApp(<Answers board={board} pool={pool} found={[]} enabled />);

  // 'biome' is answered as 'nature' in French; English is what this renders in.
  expect(screen.getByTestId('answer-biome')).toHaveTextContent('biome');
});

test('is not rendered at all when it is not wanted', () => {
  renderApp(<Answers board={board} pool={pool} found={[]} enabled={false} />);

  expect(screen.queryByTestId('answers')).toBeNull();
});
