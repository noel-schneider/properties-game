import { loadLifetime, saveLifetime, STORAGE_KEY } from './storage'
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
