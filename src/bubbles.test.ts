import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const graphCss = readFileSync(join(__dirname, 'Graph.css'), 'utf8');
const graph = readFileSync(join(__dirname, 'Graph.tsx'), 'utf8');
const skyCss = readFileSync(join(__dirname, 'Sky.css'), 'utf8');

/**
 * What a bubble of air is drawn as.
 *
 * A filled disc is a dot, and twenty dots rising up a screen are twenty dots.
 * What makes it a bubble is that you can see through the middle of it: a
 * bright rim where the light goes round, a highlight off to one side, and
 * almost nothing in between.
 */

test('the air on the board is a shell rather than a disc', () => {
  expect(graph).toMatch(/<radialGradient id="air"/);
  expect(graphCss).toMatch(/\.spout__air\s*\{[^}]*fill:\s*url\(#air\)/);
  expect(graphCss).toMatch(/\.exhale\s*\{[^}]*fill:\s*url\(#air\)/);
});

test('its middle is nearly empty and its rim is not', () => {
  const air = graph.slice(graph.indexOf('<radialGradient id="air"'), graph.indexOf('</radialGradient>'));
  const stops = [...air.matchAll(/stopOpacity=\{([\d.]+)\}/g)].map((found) => Number(found[1]));

  expect(stops.length).toBeGreaterThanOrEqual(4);
  // Somewhere past the middle it comes back up, which is the rim.
  expect(Math.max(...stops.slice(2))).toBeGreaterThan(Math.min(...stops.slice(1, 3)));
});

test('and it is lit from one side rather than from everywhere', () => {
  // A highlight in the centre is a sphere lit from the camera, which is the
  // other way a drawn bubble gives itself away.
  const air = graph.slice(graph.indexOf('<radialGradient id="air"'), graph.indexOf('</radialGradient>'));

  expect(air).toMatch(/fx="[^"]+"/);
  expect(air).toMatch(/fy="[^"]+"/);
});

test('the motes in the water are shells too', () => {
  expect(skyCss).toMatch(/\.sky__mote\s*\{[^}]*background:[^;]*radial-gradient/);
});

test('air rising wanders rather than going up a ruler', () => {
  // Bubbles wobble on the way up. A dead straight line is the giveaway that
  // nothing is pushing back.
  for (const [name, css] of [['rise', skyCss], ['let-go', graphCss], ['exhale', graphCss]] as const) {
    const frames = css.slice(css.indexOf(`@keyframes ${name}`));
    const body = frames.slice(0, frames.indexOf('}\n\n') + 1);
    const across = [...body.matchAll(/translate3?d?\(([^,]+),/g)].map((found) => found[1].trim());

    expect(new Set(across).size, name).toBeGreaterThan(2);
  }
});
