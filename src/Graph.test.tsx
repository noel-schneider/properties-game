import { screen } from '@testing-library/react'
import { renderApp } from './test-utils'
import { act } from 'react'
import Graph from './Graph'
import { BUBBLE_GAP, VIEW_HEIGHT, VIEW_WIDTH } from './useBubbleLayout'
import type { Concept } from './types'

const concepts: Concept[] = Array.from({ length: 15 }, (_, i) => ({
  name: `concept-${i}`,
  properties: ['thing'],
}));

function positions(): string[] {
  return screen.getAllByRole('checkbox').map((g) => g.getAttribute('transform') ?? '');
}

function runFrames(count: number) {
  act(() => {
    for (let i = 0; i < count; i++) vi.advanceTimersByTime(16);
  });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('the bubbles drift into place instead of appearing settled', () => {
  renderApp(<Graph concepts={concepts} selected={[]} solved={[]} onToggle={() => {}} />);

  const atStart = positions();
  runFrames(10);

  expect(positions()).not.toEqual(atStart);
});

test('the drift comes to rest, so the bubbles can be aimed at', () => {
  renderApp(<Graph concepts={concepts} selected={[]} solved={[]} onToggle={() => {}} />);

  runFrames(600);
  const settled = positions();
  runFrames(120);

  expect(positions()).toEqual(settled);
});

function centres(): Array<{ x: number; y: number }> {
  return positions().map((transform) => {
    const [x, y] = transform.replace(/[^\d.,-]/g, '').split(',').map(Number);
    return { x, y };
  });
}

test('no bubble leaves the frame on its way there, not just once it arrives', () => {
  renderApp(<Graph concepts={concepts} selected={[]} solved={[]} onToggle={() => {}} />);

  // Sampled throughout the animation: a bubble that flies off screen and comes
  // back is still a bubble that flew off screen.
  for (let frame = 0; frame < 300; frame++) {
    runFrames(1);
    for (const { x, y } of centres()) {
      expect(Math.abs(x) + 62).toBeLessThanOrEqual(VIEW_WIDTH / 2);
      expect(Math.abs(y) + 62).toBeLessThanOrEqual(VIEW_HEIGHT / 2);
    }
  }
});

test('every bubble ends up inside the frame, edges included', () => {
  renderApp(<Graph concepts={concepts} selected={[]} solved={[]} onToggle={() => {}} />);
  runFrames(600);

  for (const { x, y } of centres()) {
    // Half the viewBox, less the radius of the bubble itself.
    expect(Math.abs(x) + 62).toBeLessThanOrEqual(VIEW_WIDTH / 2);
    expect(Math.abs(y) + 62).toBeLessThanOrEqual(VIEW_HEIGHT / 2);
  }
});

test('the bubbles keep clear of one another rather than touching', () => {
  renderApp(<Graph concepts={concepts} selected={[]} solved={[]} onToggle={() => {}} />);
  runFrames(600);

  const placed = centres();
  for (let a = 0; a < placed.length; a++) {
    for (let b = a + 1; b < placed.length; b++) {
      const apart = Math.hypot(placed[a].x - placed[b].x, placed[a].y - placed[b].y);

      // Edge to edge, not centre to centre.
      expect(apart - 2 * 62).toBeGreaterThanOrEqual(BUBBLE_GAP - 1);
    }
  }
});

test('a bubble keeps its identity while it moves, so clicks stay reliable', () => {
  renderApp(<Graph concepts={concepts} selected={['concept-3']} solved={[]} onToggle={() => {}} />);
  runFrames(40);

  expect(screen.getByRole('checkbox', { name: 'concept-3' })).toHaveAttribute('aria-checked', 'true');
});

test('a selected bubble carries the selected class even under the cursor', () => {
  renderApp(<Graph concepts={concepts} selected={['concept-2']} solved={[]} onToggle={() => {}} />);

  const bubble = screen.getByRole('checkbox', { name: 'concept-2' });
  expect(bubble).toHaveClass('bubble--selected');
  expect(bubble).toHaveAttribute('aria-checked', 'true');
});

test('the bubbles keep a comfortable distance on average, not just a legal one', () => {
  renderApp(<Graph concepts={concepts} selected={[]} solved={[]} onToggle={() => {}} />);
  runFrames(600);

  const placed = centres();
  const nearest = placed.map((a, i) => {
    const others = placed.filter((_, j) => j !== i);
    return Math.min(...others.map((b) => Math.hypot(a.x - b.x, a.y - b.y)));
  });
  const mean = nearest.reduce((sum, d) => sum + d, 0) / nearest.length - 2 * 62;

  expect(mean).toBeGreaterThan(25);
});

test('the bubbles are spread, not packed on a regular lattice', () => {
  renderApp(<Graph concepts={concepts} selected={[]} solved={[]} onToggle={() => {}} />);
  runFrames(600);

  const placed = centres();
  const nearest = placed.map((a, i) => {
    const others = placed.filter((_, j) => j !== i);
    return Math.min(...others.map((b) => Math.hypot(a.x - b.x, a.y - b.y)));
  });

  const mean = nearest.reduce((sum, d) => sum + d, 0) / nearest.length;
  const spread = Math.sqrt(
    nearest.reduce((sum, d) => sum + (d - mean) ** 2, 0) / nearest.length,
  );

  // Collision alone puts every bubble at exactly the same distance from its
  // neighbours, which is a honeycomb rather than a graph. Repulsion has to be
  // what sets the spacing for the distances to vary at all.
  expect(spread).toBeGreaterThan(5);
});

const foundGroup = { property: 'thing', concepts: ['concept-0', 'concept-1', 'concept-2'] };

test('a found group is drawn tied together', () => {
  renderApp(<Graph concepts={concepts} selected={[]} solved={[foundGroup]} onToggle={() => {}} />);
  runFrames(600);

  const ties = document.querySelectorAll('.found__tie');
  expect(ties).toHaveLength(foundGroup.concepts.length);
});

test('a found group carries the name of what it was', () => {
  renderApp(<Graph concepts={concepts} selected={[]} solved={[foundGroup]} onToggle={() => {}} />);

  expect(screen.getByText('thing')).toBeInTheDocument();
});

test('a found group draws closer together than the rest of the board', () => {
  renderApp(<Graph concepts={concepts} selected={[]} solved={[foundGroup]} onToggle={() => {}} />);
  runFrames(600);

  const place = (name: string) => {
    const transform = screen.getByLabelText(name).getAttribute('transform')!;
    const [x, y] = transform.replace(/[^\d.,-]/g, '').split(',').map(Number);
    return { x, y };
  };

  const within = foundGroup.concepts.flatMap((a, i) =>
    foundGroup.concepts.slice(i + 1).map((b) => {
      const [p, q] = [place(a), place(b)];
      return Math.hypot(p.x - q.x, p.y - q.y);
    }),
  );
  const loose = concepts.filter((c) => !foundGroup.concepts.includes(c.name));
  const between = loose.flatMap((a, i) =>
    loose.slice(i + 1).map((b) => {
      const [p, q] = [place(a.name), place(b.name)];
      return Math.hypot(p.x - q.x, p.y - q.y);
    }),
  );

  const average = (ds: number[]) => ds.reduce((s, d) => s + d, 0) / ds.length;
  expect(average(within)).toBeLessThan(average(between));
});

test('a found concept can no longer be picked', () => {
  const onToggle = vi.fn();
  renderApp(<Graph concepts={concepts} selected={[]} solved={[foundGroup]} onToggle={onToggle} />);

  const bubbles = screen.getAllByRole('checkbox').map((b) => b.getAttribute('aria-label'));
  for (const name of foundGroup.concepts) {
    expect(bubbles).not.toContain(name);
    expect(screen.getByLabelText(name)).toHaveAttribute('data-found', 'true');
  }
});

test('the name of a found group stays inside the frame, wherever the group lands', () => {
  // Every concept belongs to the group, so the cluster is as large and as
  // badly placed as it can get.
  const everything = { property: 'thing', concepts: concepts.map((c) => c.name) };
  renderApp(<Graph concepts={concepts} selected={[]} solved={[everything]} onToggle={() => {}} />);
  runFrames(600);

  const label = document.querySelector('.found__label')!;
  const y = Number(label.getAttribute('y'));
  const x = Number(label.getAttribute('x'));

  expect(Math.abs(y)).toBeLessThanOrEqual(VIEW_HEIGHT / 2);
  expect(Math.abs(x)).toBeLessThanOrEqual(VIEW_WIDTH / 2);
});
