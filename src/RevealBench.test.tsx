import { fireEvent, render, screen } from '@testing-library/react'
import RevealBench from './RevealBench'
import { REVEALS } from './reveal'

test('every way of drawing a reveal is on the bench', () => {
  // The bench exists to compare them, so one missing is the whole point lost.
  render(<RevealBench reveal="loops" onPick={() => {}} />);

  expect(screen.getAllByRole('button')).toHaveLength(REVEALS.length);
});

test('the one in use says so', () => {
  render(<RevealBench reveal="arcs" onPick={() => {}} />);

  expect(screen.getByRole('button', { name: 'arcs' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'rings' })).toHaveAttribute('aria-pressed', 'false');
});

test('picking one asks for it', () => {
  const picked: string[] = [];
  render(<RevealBench reveal="loops" onPick={(next) => picked.push(next)} />);

  fireEvent.click(screen.getByRole('button', { name: 'rings' }));

  expect(picked).toEqual(['rings']);
});
