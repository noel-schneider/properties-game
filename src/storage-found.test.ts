import { FOUND_KEY, loadFound, saveFound } from './achievements/storage'

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

test('what has been found survives a round trip', () => {
  const found = [{ property: 'biome', concepts: ['jungle', 'desert', 'forest'] }];
  saveFound(found);

  expect(loadFound()).toEqual(found);
});

test('nothing stored yet reads as a fresh game', () => {
  expect(loadFound()).toEqual([]);
});

test('entries of the wrong shape are dropped rather than trusted', () => {
  localStorage.setItem(
    FOUND_KEY,
    JSON.stringify([{ property: 'biome', concepts: ['jungle'] }, { property: 7 }, null, 'nonsense']),
  );

  expect(loadFound()).toEqual([{ property: 'biome', concepts: ['jungle'] }]);
});

test('storage that throws leaves a fresh game rather than crashing', () => {
  vi.stubGlobal('localStorage', {
    getItem: () => { throw new DOMException('denied'); },
    setItem: () => { throw new DOMException('denied'); },
  });

  expect(loadFound()).toEqual([]);
  expect(() => saveFound([])).not.toThrow();
});
