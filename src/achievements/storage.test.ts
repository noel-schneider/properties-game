import { BOARD_KEY, loadBoard, loadLifetime, loadMuted, loadRunStats, MUTED_KEY, RUN_KEY, saveBoard, saveLifetime, saveMuted, saveRunStats, STORAGE_KEY } from './storage'
import { emptyLifetime } from './progress'

afterEach(() => {
  // Unstub first: a stubbed localStorage has no clear().
  vi.unstubAllGlobals();
  localStorage.clear();
});

test('a lifetime record survives a round trip', () => {
  const lifetime = { ...emptyLifetime(), unlocked: ['first-light'], aliasAnswers: 3 };
  saveLifetime(lifetime);

  expect(loadLifetime()).toEqual(lifetime);
});

test('nothing stored yet reads as an empty record', () => {
  expect(loadLifetime()).toEqual(emptyLifetime());
});

test('an unreadable record is discarded rather than trusted', () => {
  localStorage.setItem(STORAGE_KEY, 'not json at all');

  expect(loadLifetime()).toEqual(emptyLifetime());
});

test('a record of the wrong shape is discarded', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ unlocked: 'first-light' }));

  expect(loadLifetime()).toEqual(emptyLifetime());
});

test('ids the catalogue no longer knows are dropped', () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...emptyLifetime(), unlocked: ['first-light', 'retired-achievement'] }),
  );

  expect(loadLifetime().unlocked).toEqual(['first-light']);
});

test('storage that throws on read leaves the game playable', () => {
  vi.stubGlobal('localStorage', {
    getItem: () => { throw new DOMException('denied'); },
    setItem: () => { throw new DOMException('denied'); },
  });

  expect(loadLifetime()).toEqual(emptyLifetime());
});

test('storage that throws on write is swallowed rather than crashing play', () => {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => { throw new DOMException('quota'); },
  });

  expect(() => saveLifetime(emptyLifetime())).not.toThrow();
});

test('the sound preference survives a round trip', () => {
  saveMuted(true);
  expect(loadMuted()).toBe(true);

  saveMuted(false);
  expect(loadMuted()).toBe(false);
});

test('sound is on when nothing was ever chosen', () => {
  expect(loadMuted()).toBe(false);
});

test('an unreadable sound preference falls back to sound on', () => {
  localStorage.setItem(MUTED_KEY, 'maybe');
  expect(loadMuted()).toBe(false);
});

test('storage that throws leaves the sound on rather than crashing', () => {
  vi.stubGlobal('localStorage', {
    getItem: () => { throw new DOMException('denied'); },
    setItem: () => { throw new DOMException('denied'); },
  });

  expect(loadMuted()).toBe(false);
  expect(() => saveMuted(true)).not.toThrow();
});

test('the run tally survives a round trip', () => {
  saveRunStats({ boards: 29, correct: 87, wrong: 12, bestStreak: 9 });

  expect(loadRunStats()).toEqual({ boards: 29, correct: 87, wrong: 12, bestStreak: 9 });
});

test('no stored tally reads as a fresh run', () => {
  expect(loadRunStats()).toEqual({ boards: 0, correct: 0, wrong: 0, bestStreak: 0 });
});

test('a tally of the wrong shape is discarded', () => {
  localStorage.setItem(RUN_KEY, JSON.stringify({ boards: 'lots' }));

  expect(loadRunStats()).toEqual({ boards: 0, correct: 0, wrong: 0, bestStreak: 0 });
});

test('storage that throws leaves a fresh run rather than crashing', () => {
  vi.stubGlobal('localStorage', {
    getItem: () => { throw new DOMException('denied'); },
    setItem: () => { throw new DOMException('denied'); },
  });

  expect(loadRunStats()).toEqual({ boards: 0, correct: 0, wrong: 0, bestStreak: 0 });
  expect(() => saveRunStats({ boards: 1, correct: 1, wrong: 0, bestStreak: 1 })).not.toThrow();
});

describe('the board itself', () => {
  afterEach(() => localStorage.clear());

  test('what was dealt comes back exactly as it was', () => {
    // Otherwise a player who is stuck reloads the page and is handed a
    // different set of concepts, which is a way out of every hard moment.
    saveBoard(['ant', 'bee', 'moth']);

    expect(loadBoard()).toEqual(['ant', 'bee', 'moth']);
  });

  test('nothing stored means nothing to restore', () => {
    expect(loadBoard()).toEqual([]);
  });

  test('a board that is not a list of names is thrown away rather than trusted', () => {
    localStorage.setItem(BOARD_KEY, '{"not":"a list"}');
    expect(loadBoard()).toEqual([]);

    localStorage.setItem(BOARD_KEY, '["ant", 7, null]');
    expect(loadBoard()).toEqual([]);

    localStorage.setItem(BOARD_KEY, 'not json at all');
    expect(loadBoard()).toEqual([]);
  });
});
