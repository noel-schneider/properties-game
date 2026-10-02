import { renderApp } from './test-utils'
import Graph, { loopAround } from './Graph'
import { DEFAULT_LINK, LINKS } from './linkStyles'
import type { Solution } from './hand'
import type { Concept } from './types'

const concepts: Concept[] = ['a', 'b', 'c', 'd'].map((name) => ({ name, properties: ['thing', 'other'] }));
const found: Solution[] = [{ property: 'thing', concepts: ['a', 'b', 'c'] }];

function board(link?: string) {
  return renderApp(
    <Graph concepts={concepts} selected={[]} found={found} onToggle={() => {}} link={link} />,
  );
}

test('the standing link is one that exists', () => {
  // DEFAULT_LINK is spelled out rather than read from the array, so that the
  // array stays out of the built game. This holds the two in step.
  expect(LINKS.map((l) => l.id)).toContain(DEFAULT_LINK);
  expect(new Set(LINKS.map((l) => l.id)).size).toBe(LINKS.length);
});

test('the board wears the link it was given, and the standing one by default', () => {
  const { unmount } = board('ribbon');
  expect(document.querySelector('.graph')).toHaveAttribute('data-link', 'ribbon');
  unmount();

  board();
  expect(document.querySelector('.graph')).toHaveAttribute('data-link', DEFAULT_LINK);
});

test('every link on the bench has a rule, so no button does nothing', () => {
  board();
  const rules = [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules].map((rule) => rule.cssText))
    .join(' ');

  for (const link of LINKS.slice(1)) {
    expect(rules).toContain(`[data-link="${link.id}"]`);
  }
});

const corners = [{ x: 0, y: -100 }, { x: 87, y: 50 }, { x: -87, y: 50 }];
const centre = { x: 0, y: 0 };

test('the membrane reaches out past the concepts, so it can hold them', () => {
  // A shape drawn through the centres would sit entirely behind the bubbles
  // and never be seen.
  const plain = loopAround(corners, centre);
  const spread = loopAround(corners, centre, 60);

  const furthest = (path: string) => {
    const n = path.match(/-?\d+\.?\d*/g)!.map(Number);
    let out = 0;
    for (let i = 0; i < n.length; i += 2) out = Math.max(out, Math.hypot(n[i], n[i + 1]));
    return out;
  };

  expect(furthest(spread)).toBeGreaterThan(furthest(plain) + 50);
});
