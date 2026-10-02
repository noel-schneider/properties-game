import { render, screen } from '@testing-library/react'
import { act } from 'react'
import Toast, { TOAST_MS } from './Toast'
import { CATALOGUE } from './catalogue'

const firstLight = CATALOGUE.find((a) => a.id === 'first-light')!;
const collector = CATALOGUE.find((a) => a.id === 'collector')!;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('announces the achievement by name and description', () => {
  render(<Toast unlocked={[firstLight]} onDismiss={() => {}} />);

  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent(firstLight.name);
  expect(alert).toHaveTextContent(firstLight.description);
});

test('several unlocked at once are all announced', () => {
  render(<Toast unlocked={[firstLight, collector]} onDismiss={() => {}} />);

  expect(screen.getAllByRole('alert')).toHaveLength(2);
});

test('each announcement dismisses itself after its delay', () => {
  const onDismiss = vi.fn();
  render(<Toast unlocked={[firstLight]} onDismiss={onDismiss} />);

  expect(onDismiss).not.toHaveBeenCalled();
  act(() => { vi.advanceTimersByTime(TOAST_MS); });
  expect(onDismiss).toHaveBeenCalledWith(firstLight.id);
});

test('nothing is rendered when nothing was unlocked', () => {
  render(<Toast unlocked={[]} onDismiss={() => {}} />);

  expect(screen.queryByRole('alert')).toBeNull();
});
