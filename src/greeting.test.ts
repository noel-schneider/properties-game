import { GREETED_KEY, loadGreeted, saveGreeted } from './greeting'

afterEach(() => localStorage.clear());

test('a player who has never been here has not been greeted', () => {
  expect(loadGreeted()).toBe(false);
});

test('once greeted, they are not greeted again', () => {
  saveGreeted();

  expect(loadGreeted()).toBe(true);
  expect(localStorage.getItem(GREETED_KEY)).toBe('true');
});

test('a browser that refuses to remember greets them again rather than breaking', () => {
  const refuse = () => { throw new Error('no storage here'); };
  const store = Object.getOwnPropertyDescriptor(Storage.prototype, 'getItem')!;
  Storage.prototype.getItem = refuse;
  try {
    expect(loadGreeted()).toBe(false);
    expect(() => saveGreeted()).not.toThrow();
  } finally {
    Object.defineProperty(Storage.prototype, 'getItem', store);
  }
});
