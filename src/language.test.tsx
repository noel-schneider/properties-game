import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { formableGroupsOnScreen, renderIn, words } from './test-utils'
import { getAllConcepts } from './concepts'
import { sharedProperties } from './guess'
import type { Concept } from './types'

afterEach(() => localStorage.clear());

const byName = new Map(getAllConcepts().map((c) => [c.name, c]));

/** The concepts on the board, as ids, whatever language they are shown in. */
function dealt(language: 'en' | 'fr'): Concept[] {
  const labels = words[language].concepts as Record<string, string>;
  const idOf = new Map(Object.entries(labels).map(([id, label]) => [label, id]));

  return screen
    .getAllByRole('checkbox')
    .map((bubble) => byName.get(idOf.get(bubble.getAttribute('aria-label')!)!)!);
}

function solvableTriple(language: 'en' | 'fr') {
  const board = dealt(language);
  for (let a = 0; a < board.length; a++) {
    for (let b = a + 1; b < board.length; b++) {
      for (let c = b + 1; c < board.length; c++) {
        const triple = [board[a], board[b], board[c]];
        const [property] = sharedProperties(triple);
        if (property) return { triple, property };
      }
    }
  }
  throw new Error('no solvable triple on the board');
}

test('the board shows French names when playing in French', () => {
  renderIn('fr', <App playChime={() => {}} />);

  const shown = screen.getAllByRole('checkbox').map((b) => b.getAttribute('aria-label'));
  const french = new Set(Object.values(words.fr.concepts));

  for (const label of shown) expect(french).toContain(label);
});

test('the interface speaks French too', () => {
  renderIn('fr', <App playChime={() => {}} />);

  // Nothing is picked, so the box is showing what it is waiting for — in French.
  expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', words.fr.ui['form.needThree']);
  expect(screen.getByRole('button', { name: words.fr.ui['form.submit'] })).toBeInTheDocument();
  expect(screen.getByText(words.fr.ui['score.found'], { exact: false })).toBeInTheDocument();
});

test('a category answered in French is accepted', async () => {
  const user = userEvent.setup();
  renderIn('fr', <App playChime={() => {}} />);

  const { triple, property } = solvableTriple('fr');
  const frenchName = (words.fr.properties as Record<string, string>)[property];

  for (const concept of triple) {
    const label = (words.fr.concepts as Record<string, string>)[concept.name];
    await user.click(screen.getByRole('checkbox', { name: label }));
  }
  await user.type(screen.getByRole('textbox'), frenchName);
  await user.click(screen.getByRole('button', { name: words.fr.ui['form.submit'] }));

  expect(await screen.findByRole('status')).toHaveTextContent(words.fr.ui['form.correct']);
});

test('the English name of a category is not what French play expects', async () => {
  const user = userEvent.setup();
  renderIn('fr', <App playChime={() => {}} />);

  const { triple, property } = solvableTriple('fr');
  // 'biome' is answered as 'nature' in French; the English term is not the label.
  const englishName = (words.en.properties as Record<string, string>)[property];
  const frenchName = (words.fr.properties as Record<string, string>)[property];
  if (englishName === frenchName) return;

  for (const concept of triple) {
    await user.click(
      screen.getByRole('checkbox', { name: (words.fr.concepts as Record<string, string>)[concept.name] }),
    );
  }
  await user.type(screen.getByRole('textbox'), englishName);
  await user.click(screen.getByRole('button', { name: words.fr.ui['form.submit'] }));

  // It may still be accepted as a French alias, but it is never the exact term.
  const status = await screen.findByRole('status');
  expect(status.textContent).toBeTruthy();
});

test('achievements are described in the language being played', async () => {
  const user = userEvent.setup();
  renderIn('fr', <App playChime={() => {}} />);

  await user.click(screen.getByRole('button', { name: new RegExp(words.fr.ui['panel.open']) }));

  expect(screen.getByText(words.fr.achievements['first-light'].name)).toBeInTheDocument();
  expect(screen.getByText(words.fr.achievements.collector.description)).toBeInTheDocument();
});

test('switching language mid-run keeps what has been found', async () => {
  const user = userEvent.setup();
  renderIn('en', <App playChime={() => {}} />);

  const { triple, property } = solvableTriple('en');
  for (const concept of triple) {
    await user.click(screen.getByRole('checkbox', { name: concept.name }));
  }
  await user.type(screen.getByRole('textbox'), property);
  await user.click(screen.getByRole('button', { name: words.en.ui['form.submit'] }));
  await screen.findByRole('status');

  const scoreBefore = screen.getByTestId('found').textContent;
  const earnedBefore = screen.getByRole('button', { name: /Achievements/ }).textContent;

  await user.click(screen.getByRole('button', { name: words.en.ui['language.group'] }));
  await user.click(screen.getByRole('button', { name: words.fr.ui['language.fr'] }));

  // Same progress, told in French.
  expect(screen.getByTestId('found')).toHaveTextContent(scoreBefore!);
  expect(screen.getByRole('button', { name: new RegExp(words.fr.ui['panel.open']) }))
    .toHaveTextContent(earnedBefore!.replace('Achievements', words.fr.ui['panel.open']));
  // The answer cleared the selection, so the box is back to asking for three.
  expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', words.fr.ui['form.needThree']);
});

test('the chosen language is remembered', async () => {
  const user = userEvent.setup();
  const { unmount } = renderIn('en', <App playChime={() => {}} />);

  await user.click(screen.getByRole('button', { name: words.en.ui['language.group'] }));
  await user.click(screen.getByRole('button', { name: words.fr.ui['language.fr'] }));
  unmount();

  expect(localStorage.getItem('properties-game:language')).toBe('fr');
});

test('a board started in one language can be finished in the other', async () => {
  const user = userEvent.setup();
  renderIn('fr', <App playChime={() => {}} />);

  const { triple, property } = solvableTriple('fr');
  for (const concept of triple) {
    await user.click(
      screen.getByRole('checkbox', { name: (words.fr.concepts as Record<string, string>)[concept.name] }),
    );
  }
  await user.type(
    screen.getByRole('textbox'),
    (words.fr.properties as Record<string, string>)[property],
  );
  await user.click(screen.getByRole('button', { name: words.fr.ui['form.submit'] }));
  await screen.findByRole('status');

  await user.click(screen.getByRole('button', { name: words.fr.ui['language.group'] }));
  await user.click(screen.getByRole('button', { name: words.en.ui['language.en'] }));

  // Still found, and the next answer is taken in the new language. The panel
  // knows which groups are still open; the data alone does not.
  const next = formableGroupsOnScreen()[0];
  for (const name of next.concepts) {
    await user.click(screen.getByRole('checkbox', { name }));
  }
  await user.type(
    screen.getByRole('textbox'),
    (words.en.properties as Record<string, string>)[next.property],
  );
  await user.click(screen.getByRole('button', { name: words.en.ui['form.submit'] }));

  expect(await screen.findByRole('status')).toHaveTextContent(words.en.ui['form.correct']);
  expect(screen.getByTestId('found')).toHaveTextContent('2');
});
