import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fireEvent, screen } from '@testing-library/react'
import { renderApp } from './test-utils'
import Scoreboard from './Scoreboard'
import Form from './Form'

const graphCss = readFileSync(join(__dirname, 'Graph.css'), 'utf8');
const formCss = readFileSync(join(__dirname, 'Form.css'), 'utf8');

test('a count that changes is replaced rather than edited in place', () => {
  // A number that ticks over should be seen to tick over, and a CSS animation
  // plays when the element arrives — so the element has to arrive.
  const { rerender } = renderApp(<Scoreboard finds={3} finished={1} total={100} remaining={4} />);
  const before = screen.getByTestId('found');

  rerender(<Scoreboard finds={4} finished={1} total={100} remaining={4} />);

  expect(screen.getByTestId('found')).not.toBe(before);
});

test('and one that has not changed is left alone', () => {
  const { rerender } = renderApp(<Scoreboard finds={3} finished={1} total={100} remaining={4} />);
  const before = screen.getByTestId('found');

  rerender(<Scoreboard finds={3} finished={1} total={100} remaining={9} />);

  expect(screen.getByTestId('found')).toBe(before);
});

test('a refused answer rocks the box it was typed in', () => {
  renderApp(<Form selected={["a", "b", "c"]} feedback="wrong" onSubmit={() => true} />);

  expect(document.querySelector('.input')!.className).toMatch(/input--refused/);
});

test('and the next refusal rocks it again, rather than sitting on the first', () => {
  // Two wrong answers running leave `feedback` on the same value, so a class
  // that depends only on that never changes and the animation never replays.
  renderApp(<Form selected={["a", "b", "c"]} feedback="wrong" onSubmit={() => true} />);
  const first = document.querySelector('.input')!.className;

  fireEvent.change(document.querySelector('.input')!, { target: { value: 'again' } });
  fireEvent.submit(document.querySelector('form')!);

  expect(document.querySelector('.input')!.className).not.toBe(first);
});

test('a right answer does not', () => {
  renderApp(<Form selected={["a", "b", "c"]} feedback="correct" onSubmit={() => true} />);

  expect(document.querySelector('.input')!.className).not.toMatch(/input--refused/);
});

test('the rocking is drawn, and stilled for anyone who asked for that', () => {
  expect(formCss).toMatch(/@keyframes refused/);
  expect(formCss).toMatch(/prefers-reduced-motion[\s\S]*input--refused/);
});

test('a concept that has given everything sinks rather than snapping shut', () => {
  expect(graphCss).toMatch(/\.bubble circle\s*\{[^}]*transition:[^;]*\br\b/);
});

test('the older outlines stir, and leave the reveal alone while it is on', () => {
  // A hovered board hands the loops their colours and their weight. A shimmer
  // running over that would undo the one thing the reveal is for.
  expect(graphCss).toMatch(/\.found__loop:not\(\[data-hue\]\)[^{]*\{[^}]*animation:\s*adrift/);
});
