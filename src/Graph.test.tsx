import { fireEvent, screen } from '@testing-library/react'
import { pinTheScatter, renderApp } from './test-utils'
import { act } from 'react'
import Graph from './Graph'
import { BUBBLE_GAP, VIEW_HEIGHT, VIEW_WIDTH } from './useBubbleLayout'
import type { Concept } from './types'

const concepts: Concept[] = Array.from({ length: 15 }, (_, i) => ({
  name: `concept-${i}`,
  // A second property shared with two others, so one found group does not
  // leave them stranded: a concept with nothing findable left shrinks, which
  // most of these tests measure.
  properties: ['thing', `pair-${i % 5}`],
}));

function positions(): string[] {
  // By class, not by role: a finished bubble is an image rather than a checkbox.
  return [...document.querySelectorAll('g.bubble')].map((g) => g.getAttribute('transform') ?? '');
}

function runFrames(count: number) {
  act(() => {
    for (let i = 0; i < count; i++) vi.advanceTimersByTime(16);
  });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  // Or the next test in the file inherits a `Math.random` that is not random.
  vi.restoreAllMocks();
});

test('the bubbles drift into place instead of appearing settled', () => {
  renderApp(<Graph concepts={concepts} selected={[]} found={[]} onToggle={() => {}} />);

  const atStart = positions();
  runFrames(10);

  expect(positions()).not.toEqual(atStart);
});

test('the drift comes to rest, so the bubbles can be aimed at', () => {
  renderApp(<Graph concepts={concepts} selected={[]} found={[]} onToggle={() => {}} />);

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
  renderApp(<Graph concepts={concepts} selected={[]} found={[]} onToggle={() => {}} />);

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
  renderApp(<Graph concepts={concepts} selected={[]} found={[]} onToggle={() => {}} />);
  runFrames(600);

  for (const { x, y } of centres()) {
    // Half the viewBox, less the radius of the bubble itself.
    expect(Math.abs(x) + 62).toBeLessThanOrEqual(VIEW_WIDTH / 2);
    expect(Math.abs(y) + 62).toBeLessThanOrEqual(VIEW_HEIGHT / 2);
  }
});

test('the bubbles keep clear of one another rather than touching', () => {
  renderApp(<Graph concepts={concepts} selected={[]} found={[]} onToggle={() => {}} />);
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
  renderApp(<Graph concepts={concepts} selected={['concept-3']} found={[]} onToggle={() => {}} />);
  runFrames(40);

  expect(screen.getByRole('checkbox', { name: 'concept-3' })).toHaveAttribute('aria-checked', 'true');
});

test('a selected bubble carries the selected class even under the cursor', () => {
  renderApp(<Graph concepts={concepts} selected={['concept-2']} found={[]} onToggle={() => {}} />);

  const bubble = screen.getByRole('checkbox', { name: 'concept-2' });
  expect(bubble).toHaveClass('bubble--selected');
  expect(bubble).toHaveAttribute('aria-checked', 'true');
});

test('the bubbles keep a comfortable distance on average, not just a legal one', () => {
  renderApp(<Graph concepts={concepts} selected={[]} found={[]} onToggle={() => {}} />);
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
  renderApp(<Graph concepts={concepts} selected={[]} found={[]} onToggle={() => {}} />);
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

test('a found group is drawn as one outline around its members', () => {
  renderApp(<Graph concepts={concepts} selected={[]} found={[foundGroup]} onToggle={() => {}} />);
  runFrames(600);

  // One closed curve rather than three spokes meeting at a bare point, which
  // read as a wiring diagram.
  const loops = document.querySelectorAll('.found__loop');
  expect(loops).toHaveLength(1);

  const path = loops[0].getAttribute('d')!;
  expect(path.endsWith('Z')).toBe(true);
  // A closed shape: one move to a corner, then a side to each of the rest.
  expect(path.match(/L/g)).toHaveLength(foundGroup.concepts.length - 1);
});


test('a group says what it was while one of its concepts is pointed at', () => {
  renderApp(<Graph concepts={concepts} selected={[]} found={[foundGroup]} onToggle={() => {}} />);
  fireEvent.pointerEnter(screen.getByLabelText('concept-0'));

  expect(screen.getByText('thing')).toBeInTheDocument();
});

test('the other groups keep their loops, named in their own right', () => {
  const older = { property: 'pair-3', concepts: ['concept-3', 'concept-8', 'concept-13'] };
  renderApp(
    <Graph concepts={concepts} selected={[]} found={[older, foundGroup]} onToggle={() => {}} />,
  );
  fireEvent.pointerEnter(screen.getByLabelText('concept-3'));

  // Every loop takes a colour while a concept is pointed at, so every loop
  // says what it is: an unnamed colour is one nobody can read.
  expect(screen.getByText('pair-3')).toBeInTheDocument();
  expect(screen.getByText('thing')).toBeInTheDocument();
  expect(document.querySelectorAll('.found__loop')).toHaveLength(2);
});

test('a found group draws closer together than the rest of the board', () => {
  renderApp(<Graph concepts={concepts} selected={[]} found={[foundGroup]} onToggle={() => {}} />);
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

test('a concept with properties left can still be picked', () => {
  renderApp(<Graph concepts={concepts} selected={[]} found={[foundGroup]} onToggle={() => {}} />);

  const bubbles = screen.getAllByRole('checkbox').map((b) => b.getAttribute('aria-label'));
  for (const name of foundGroup.concepts) {
    expect(bubbles).toContain(name);
    expect(screen.getByLabelText(name)).toHaveAttribute('data-found', 'false');
  }
});

test('a concept with nothing left is finished, and stops being pickable', () => {
  // Both of its properties spent.
  const spent = [
    foundGroup,
    { property: 'pair-0', concepts: ['concept-0', 'concept-5', 'concept-10'] },
  ];
  renderApp(<Graph concepts={concepts} selected={[]} found={spent} onToggle={() => {}} />);

  const bubbles = screen.getAllByRole('checkbox').map((b) => b.getAttribute('aria-label'));
  expect(bubbles).not.toContain('concept-0');
  expect(screen.getByLabelText('concept-0')).toHaveAttribute('data-found', 'true');
  expect(screen.getByLabelText('concept-0')).toHaveAttribute('data-progress', '2/2');
});

test('the name of a found group stays inside the frame, wherever the group lands', () => {
  // Every concept belongs to the group, so the cluster is as large and as
  // badly placed as it can get.
  const everything = { property: 'thing', concepts: concepts.map((c) => c.name) };
  renderApp(<Graph concepts={concepts} selected={[]} found={[everything]} onToggle={() => {}} />);
  runFrames(600);
  fireEvent.pointerEnter(screen.getByLabelText('concept-0'));

  const label = document.querySelector('.found__label')!;
  const y = Number(label.getAttribute('y'));
  const x = Number(label.getAttribute('x'));

  expect(Math.abs(y)).toBeLessThanOrEqual(VIEW_HEIGHT / 2);
  expect(Math.abs(x)).toBeLessThanOrEqual(VIEW_WIDTH / 2);
});

test('finished concepts take less room, not just a smaller picture', () => {
  const spread = (found: Array<{ property: string; concepts: string[] }>) => {
    // From the same scatter both times, or the two boards being compared
    // started in different places and the ratio is whatever the draw gave.
    pinTheScatter();
    const view = renderApp(
      <Graph concepts={concepts} selected={[]} found={found} onToggle={() => {}} />,
    );
    runFrames(600);
    const places = centres();
    view.unmount();
    return Math.max(...places.map((p) => Math.hypot(p.x, p.y)));
  };

  // Everything finished: each bubble asks for a third of the room, so the whole
  // cluster draws in. If only the picture shrank, the spread would not move.
  const everything = ['thing', ...Array.from({ length: 5 }, (_, i) => `pair-${i}`)].map(
    (property) => ({
      property,
      concepts: concepts.filter((c) => c.properties.includes(property)).map((c) => c.name),
    }),
  );

  expect(spread(everything)).toBeLessThan(spread([]) * 0.75);
});

test('a bubble is drawn as something to poke, not as a diagram', () => {
  renderApp(<Graph concepts={concepts} selected={[]} found={[]} onToggle={() => {}} />);

  // Chosen by eye against the alternatives, and pinned here so a later
  // refactor cannot quietly flatten the board back to a hairline. The shadow
  // that goes with it is pinned in the browser instead: jsdom does not
  // implement `filter` at all, and drops it from the rule as well as from the
  // computed style.
  const style = getComputedStyle(document.querySelector('g.bubble circle')!);
  expect(Number(style.strokeWidth)).toBeGreaterThanOrEqual(3);
});

test('a board redrawn with the same concepts stays exactly where it was', () => {
  // App rebuilds its concepts array on every render, so every click hands the
  // board a new array holding the same things. That must change nothing: a
  // board that re-scatters when you select a bubble reads as a refresh.
  const props = { selected: [] as string[], found: [], onToggle: () => {} };
  const { rerender } = renderApp(<Graph concepts={concepts} {...props} />);
  runFrames(400);
  const before = positions();

  rerender(<Graph concepts={[...concepts]} {...props} selected={[concepts[0].name]} />);
  runFrames(1);

  expect(positions()).toEqual(before);
});

test('a concept dealt in arrives beside the others, without moving them', () => {
  // The board is meant to persist: finding a group adds concepts beside the
  // ones already there. Re-scattering everything would throw away the shape
  // the player has been reading.
  const props = { selected: [], found: [], onToggle: () => {} };
  const { rerender } = renderApp(<Graph concepts={concepts} {...props} />);
  runFrames(400);
  const before = positions();

  const newcomer: Concept = { name: 'newcomer', properties: ['thing'] };
  rerender(<Graph concepts={[...concepts, newcomer]} {...props} />);
  runFrames(1);

  // Near where they were, not identical: the newcomer pushes in and the
  // others give it room, which is the point. What must not happen is being
  // dealt again from scratch, which throws them the width of the frame.
  const moved = positions().slice(0, concepts.length).map((now, i) => {
    const [nx, ny] = now.match(/-?\d+\.?\d*/g)!.map(Number);
    const [bx, by] = before[i].match(/-?\d+\.?\d*/g)!.map(Number);
    return Math.hypot(nx - bx, ny - by);
  });

  expect(Math.max(...moved)).toBeLessThan(30);
  expect(positions()).toHaveLength(concepts.length + 1);
});

test('the group just found keeps a bright loop, and the older ones step back', () => {
  const older = { property: 'pair-3', concepts: ['concept-3', 'concept-8', 'concept-13'] };
  renderApp(
    <Graph concepts={concepts} selected={[]} found={[older, foundGroup]} onToggle={() => {}} />,
  );

  // The same rule the names already follow: at twenty groups everything drawn
  // at full strength is a thicket, and the one just found is the one the
  // player is looking for.
  const loops = [...document.querySelectorAll('.found__loop')];
  const bright = loops.filter((loop) => loop.classList.contains('found__loop--latest'));
  expect(bright).toHaveLength(1);
  expect(loops).toHaveLength(2);
});


test('a found group is named in its middle, over the bubbles', () => {
  renderApp(<Graph concepts={concepts} selected={[]} found={[foundGroup]} onToggle={() => {}} />);
  runFrames(600);
  fireEvent.pointerEnter(screen.getByLabelText('concept-0'));

  const places = foundGroup.concepts.map((name) => {
    const [x, y] = screen.getByLabelText(name).getAttribute('transform')!
      .match(/-?\d+\.?\d*/g)!.map(Number);
    return { x, y };
  });
  const middle = {
    x: places.reduce((sum, p) => sum + p.x, 0) / places.length,
    y: places.reduce((sum, p) => sum + p.y, 0) / places.length,
  };

  const label = document.querySelector('.found__label')!;
  expect(Number(label.getAttribute('x'))).toBeCloseTo(middle.x, 0);
  expect(Number(label.getAttribute('y'))).toBeCloseTo(middle.y, 0);

  // Drawn after every bubble, or a tight group hides its own name.
  const drawn = [...document.querySelectorAll('.bubble, .found__label')];
  expect(drawn.indexOf(label)).toBeGreaterThan(
    drawn.map((el) => el.classList.contains('bubble')).lastIndexOf(true),
  );
});

describe('telling a click from a drag', () => {
  function gesture(travel: number) {
    const picked: string[] = [];
    renderApp(
      <Graph concepts={concepts} selected={[]} found={[]} onToggle={(n) => picked.push(n)} />,
    );
    runFrames(600);

    const bubble = screen.getByLabelText('concept-0');
    fireEvent.pointerDown(bubble, { button: 0, clientX: 500, clientY: 300 });
    fireEvent.pointerMove(bubble, { clientX: 500 + travel, clientY: 300 });
    fireEvent.pointerUp(bubble, { clientX: 500 + travel, clientY: 300 });
    fireEvent.click(bubble);
    return picked;
  }

  test('a click that slips a few pixels still selects', () => {
    // A hand that does not move at all is not what a mouse click is, and a
    // bubble that silently refuses to be picked gives the player no clue why
    // their answer was then refused.
    expect(gesture(8)).toEqual(['concept-0']);
  });

  test('a real drag still selects nothing', () => {
    expect(gesture(60)).toEqual([]);
  });
})
