import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const graphCss = readFileSync(join(__dirname, 'Graph.css'), 'utf8');
const graph = readFileSync(join(__dirname, 'Graph.tsx'), 'utf8');
const skyCss = readFileSync(join(__dirname, 'Sky.css'), 'utf8');

/**
 * What a bubble of air is drawn as.
 *
 * A soft light, and nothing more. A rim, a highlight and a see-through middle
 * were tried: drawn that carefully they read as photographs of bubbles
 * floating over a board that is otherwise flat colour and plain shapes, and
 * the mismatch is all anybody sees. What the game wants here is a mark, not
 * a model.
 */

test('the air is one soft light rather than a drawn sphere', () => {
  const air = graph.slice(graph.indexOf('<radialGradient id="air"'), graph.indexOf('</radialGradient>'));
  const stops = [...air.matchAll(/stopOpacity=\{([\d.]+)\}/g)].map((found) => Number(found[1]));

  expect(stops.length).toBeGreaterThanOrEqual(2);
  // Only ever fading. A stop that comes back up is a rim, and a rim is the
  // glass bubble this replaced.
  expect([...stops].sort((a, b) => b - a)).toEqual(stops);
});

test('and it is lit from everywhere, because it is not lit at all', () => {
  // No `fx`/`fy`: an off-centre highlight is a light source, and a light
  // source is a promise about where the lamp is that nothing else here keeps.
  const air = graph.slice(graph.indexOf('<radialGradient id="air"'), graph.indexOf('</radialGradient>'));

  expect(air).not.toMatch(/fx=/);
  expect(air).not.toMatch(/fy=/);
});

test('both kinds on the board use it', () => {
  expect(graphCss).toMatch(/\.spout__air\s*\{[^}]*fill:\s*url\(#air\)/);
  expect(graphCss).toMatch(/\.exhale\s*\{[^}]*fill:\s*url\(#air\)/);
});

test('the motes in the water are soft lights too', () => {
  const mote = skyCss.slice(skyCss.indexOf('.sky__mote {'), skyCss.indexOf('@keyframes rise'));

  expect(mote).toMatch(/radial-gradient/);
  // One gradient, not a highlight laid over a rim.
  expect(mote.match(/radial-gradient/g)).toHaveLength(1);
});

test('air rises without wandering back on itself', () => {
  // It leans, once. A path that goes left, then right, then left again is a
  // bubble being animated at you.
  for (const [name, css] of [['rise', skyCss], ['let-go', graphCss], ['exhale', graphCss]] as const) {
    const frames = css.slice(css.indexOf(`@keyframes ${name}`));
    const body = frames.slice(0, frames.indexOf('}\n\n') + 1);
    const across = [...body.matchAll(/translate3?d?\(\s*([^,]+),/g)]
      .map((found) => found[1])
      .filter((value) => !value.includes('0px') && value !== '0');

    // Every lean the same way: one direction, or none at all.
    expect(new Set(across.map((value) => value.includes('-'))).size, name).toBeLessThanOrEqual(1);
  }
});

test('and without going in and out of round on the way', () => {
  // Squashing a rising bubble is the last of the three things that made these
  // look studied rather than drawn.
  for (const [name, css] of [['rise', skyCss], ['let-go', graphCss], ['exhale', graphCss]] as const) {
    const frames = css.slice(css.indexOf(`@keyframes ${name}`));
    const body = frames.slice(0, frames.indexOf('}\n\n') + 1);

    expect(body, name).not.toMatch(/scale\([^)]+,[^)]+\)/);
  }
});
