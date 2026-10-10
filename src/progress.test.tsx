import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { pinTheScatter, renderApp } from './test-utils'
import Sky from './Sky'
import Hint from './Hint'
import Graph from './Graph'
import type { Solution } from './hand'
import type { Concept } from './types'

const graphCss = readFileSync(join(__dirname, 'Graph.css'), 'utf8');

function sky() {
  return document.querySelector('.sky') as HTMLElement;
}

test('the water is black at the start of a game', () => {
  // The whole of the progression: you begin as deep as the game goes.
  render(<Sky risen={0} />);

  expect(sky().style.getPropertyValue('--risen')).toBe('0');
});

test('and the surface comes closer as concepts are finished', () => {
  render(<Sky risen={0.42} />);

  expect(Number(sky().style.getPropertyValue('--risen'))).toBeCloseTo(0.42);
});

test('a game cannot rise past the surface, however it is asked', () => {
  // The count is passed in from outside, and nothing good happens if a
  // fraction over one reaches the gradient.
  render(<Sky risen={3} />);

  expect(Number(sky().style.getPropertyValue('--risen'))).toBe(1);
});

const concepts: Concept[] = [
  { name: 'ant', properties: ['insect', 'small'] },
  { name: 'bee', properties: ['insect', 'small'] },
  { name: 'moth', properties: ['insect', 'small'] },
  { name: 'coin', properties: ['metal', 'small'] },
  { name: 'key', properties: ['metal', 'small'] },
];

// ant, bee and moth have `small` left and nothing else.
const found: Solution[] = [{ property: 'insect', concepts: ['ant', 'bee', 'moth'] }];

test('a concept one category from done says so on its gauge', () => {
  pinTheScatter();
  renderApp(<Graph concepts={concepts} selected={[]} found={found} onToggle={() => {}} />);

  expect(screen.getByLabelText('ant').classList.contains('bubble--brimming')).toBe(true);
  expect(screen.getByLabelText('coin').classList.contains('bubble--brimming')).toBe(false);
});

test('and a concept nobody has used yet does not', () => {
  // Brimming is about being nearly spent. A concept with everything still to
  // give has the emptiest gauge on the board, not the fullest.
  pinTheScatter();
  renderApp(<Graph concepts={concepts} selected={[]} found={[]} onToggle={() => {}} />);

  expect(document.querySelectorAll('.bubble--brimming')).toHaveLength(0);
});

test('a gauge about to fill is drawn as something happening', () => {
  expect(graphCss).toMatch(/\.bubble--brimming[\s\S]{0,200}animation:/);
});

test('the hint button waits to be asked, and then starts shifting its weight', () => {
  // Not the automatic hint coming back: nothing is given away, the button
  // merely stops being furniture once a player has been stuck a while.
  renderApp(<Hint available urging={false} onAsk={() => {}} />);
  expect(screen.getByRole('button').classList.contains('control--urging')).toBe(false);

  renderApp(<Hint available urging onAsk={() => {}} />);
  expect(screen.getAllByRole('button')[1].classList.contains('control--urging')).toBe(true);
});

test('a button with nothing to show never asks to be pressed', () => {
  renderApp(<Hint available={false} urging onAsk={() => {}} />);

  expect(screen.getByRole('button').classList.contains('control--urging')).toBe(false);
});
