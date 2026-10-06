import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The board's cursors, read out of the stylesheet they live in.
 *
 * Pinned here rather than left to the eye because of how this fails: a cursor
 * whose data URI is malformed falls back to the system arrow in silence. The
 * board looks a little plainer and nothing anywhere says why.
 */
const css = readFileSync(join(__dirname, 'Graph.css'), 'utf8');

interface Cursor {
    svg: string;
    width: number;
    height: number;
    hotspot: { x: number; y: number };
}

function cursorNamed(name: string): Cursor {
    const line = css.match(new RegExp(`--${name}:\\s*url\\("([^"]+)"\\)\\s+(\\d+)\\s+(\\d+)`));
    if (!line) throw new Error(`no --${name} cursor in Graph.css`);

    const [, uri, x, y] = line;
    const svg = decodeURIComponent(uri.replace('data:image/svg+xml,', '')).replace(/%25/g, '%');
    const size = (axis: string) => Number(svg.match(new RegExp(`${axis}='(\\d+)'`))?.[1] ?? 0);

    return { svg, width: size('width'), height: size('height'), hotspot: { x: Number(x), y: Number(y) } };
}

const NAMES = ['spark', 'spark-over', 'spark-held'];

describe.each(NAMES)('--%s', (name) => {
  test('it is a drawing a browser can actually decode', () => {
    const { svg } = cursorNamed(name);

    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
    // The colours go through two layers of escaping on the way into CSS, and
    // getting that wrong is what turns a cursor into a silent arrow.
    expect(svg).toMatch(/fill='#[0-9a-f]{6}'/i);
  });

  test('it is drawn large enough not to come out crunchy', () => {
    // At 26 pixels the thin waist of the spark landed on a pixel and a half
    // and read as jagged, which is what a tester saw.
    const { width, height } = cursorNamed(name);

    expect(width).toBeGreaterThanOrEqual(32);
    expect(height).toBe(width);
  });

  test('the player aims with the middle of it', () => {
    // The hotspot is the dot at the centre of the spark: what you aim with
    // should be the thing you can see.
    const { width, height, hotspot } = cursorNamed(name);

    expect(hotspot.x).toBe(Math.round(width / 2));
    expect(hotspot.y).toBe(Math.round(height / 2));
  });
});

test('the three say three different things', () => {
  const drawings = NAMES.map((name) => cursorNamed(name).svg);

  expect(new Set(drawings).size).toBe(NAMES.length);
});

test('a concept under the pointer gets a cursor of its own', () => {
  // The whole of the complaint: the cursor never changed, so nothing on the
  // board ever looked like it could be picked up.
  expect(css).toMatch(/\.bubble:hover[^{]*\{[^}]*cursor:\s*var\(--spark-over\)/);
});

test('each cursor names a plain one to fall back to', () => {
  // Some systems refuse an image cursor outright. What follows the comma is
  // what they get, and it still has to say what the thing under it does.
  for (const name of NAMES) {
    const declaration = css.match(new RegExp(`--${name}:[^;]+;`))![0];
    expect(declaration, name).toMatch(/,\s*(crosshair|grab|grabbing|pointer)\s*;/);
  }
});
