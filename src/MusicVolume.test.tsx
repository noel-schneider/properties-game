import { fireEvent, screen } from '@testing-library/react'
import { renderApp } from './test-utils'
import App from './App'
import MusicVolume from './MusicVolume'
import { loadMusicVolume, MUSIC_VOLUME_KEY, saveMusicVolume } from './achievements/storage'

afterEach(() => localStorage.clear());

test('the music plays at full volume unless it has been turned down', () => {
  expect(loadMusicVolume()).toBe(1);

  saveMusicVolume(0.4);
  expect(loadMusicVolume()).toBe(0.4);
});

test('a stored volume that is not a fraction is thrown away rather than trusted', () => {
  for (const stored of ['loud', '5', '-1', '']) {
    localStorage.setItem(MUSIC_VOLUME_KEY, stored);
    expect(loadMusicVolume(), stored).toBe(1);
  }
});

test('the slider says where it was moved to', () => {
  const levels: number[] = [];
  renderApp(<MusicVolume level={1} playing onChange={(level) => levels.push(level)} />);

  fireEvent.change(screen.getByRole('slider', { name: /music volume/i }), { target: { value: '40' } });

  expect(levels).toEqual([0.4]);
});

test('it is out of reach while the music is off, since there is nothing to set', () => {
  renderApp(<MusicVolume level={1} playing={false} onChange={() => {}} />);

  expect(screen.getByRole('slider', { name: /music volume/i })).toBeDisabled();
});

test('the game remembers how loud the music was left', () => {
  // The slider is wired to the bed through App, which is also what persists it:
  // a level that is forgotten on reload is a level nobody will bother setting.
  renderApp(<App playChime={() => {}} />);

  fireEvent.change(screen.getByRole('slider', { name: /music volume/i }), { target: { value: '30' } });

  expect(loadMusicVolume()).toBe(0.3);
});
