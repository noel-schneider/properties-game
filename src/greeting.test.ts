import { SKIP_KEY, skipIntro } from './greeting'

afterEach(() => localStorage.clear());

test('the rules are shown unless something says otherwise', () => {
  expect(skipIntro()).toBe(false);
});

test('the end-to-end suite can put them aside', () => {
  localStorage.setItem(SKIP_KEY, 'true');

  expect(skipIntro()).toBe(true);
});

test('a browser that refuses to remember shows them rather than breaking', () => {
  const kept = Object.getOwnPropertyDescriptor(Storage.prototype, 'getItem')!;
  Storage.prototype.getItem = () => { throw new Error('no storage here'); };
  try {
    expect(skipIntro()).toBe(false);
  } finally {
    Object.defineProperty(Storage.prototype, 'getItem', kept);
  }
});
