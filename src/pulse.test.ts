import { chordStruck, onChord } from './pulse'

test('a listener hears every chord, with how big the orchestra is', () => {
  const heard: number[] = [];
  const stop = onChord((parts) => heard.push(parts));

  chordStruck(1);
  chordStruck(4);
  stop();
  chordStruck(5);

  expect(heard).toEqual([1, 4]);
});

test('two listeners both hear it', () => {
  const heard: string[] = [];
  const a = onChord(() => heard.push('a'));
  const b = onChord(() => heard.push('b'));

  chordStruck(1);
  a();
  b();

  expect(heard.sort()).toEqual(['a', 'b']);
});

test('a listener that throws does not silence the others', () => {
  // The music must never be able to take the game down with it.
  const heard: string[] = [];
  const bad = onChord(() => { throw new Error('nope'); });
  const good = onChord(() => heard.push('good'));

  expect(() => chordStruck(2)).not.toThrow();
  expect(heard).toEqual(['good']);
  bad();
  good();
});
