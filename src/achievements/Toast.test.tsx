import { screen } from '@testing-library/react'
import { renderApp, words } from '../test-utils'
import { act } from 'react'
import Toast, { TOAST_MS } from './Toast'
import { CATALOGUE } from './catalogue'

const firstLight = CATALOGUE.find((a) => a.id === 'first-light')!;
const collector = CATALOGUE.find((a) => a.id === 'collector')!;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('announces the achievement by name and description', () => {
  renderApp(<Toast unlocked={[firstLight]} onDismiss={() => {}} />);

  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent(words.en.achievements[firstLight.id as 'first-light'].name);
  expect(alert).toHaveTextContent(words.en.achievements[firstLight.id as 'first-light'].description);
});

test('several unlocked at once are all announced', () => {
  renderApp(<Toast unlocked={[firstLight, collector]} onDismiss={() => {}} />);

  expect(screen.getAllByRole('alert')).toHaveLength(2);
});

test('each announcement dismisses itself after its delay', () => {
  const onDismiss = vi.fn();
  renderApp(<Toast unlocked={[firstLight]} onDismiss={onDismiss} />);

  expect(onDismiss).not.toHaveBeenCalled();
  act(() => { vi.advanceTimersByTime(TOAST_MS); });
  expect(onDismiss).toHaveBeenCalledWith(firstLight.id);
});

test('nothing is rendered when nothing was unlocked', () => {
  renderApp(<Toast unlocked={[]} onDismiss={() => {}} />);

  expect(screen.queryByRole('alert')).toBeNull();
});
