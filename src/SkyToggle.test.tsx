import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SkyToggle from './SkyToggle'
import { PALETTES } from './sky/palettes'
import { LanguageProvider } from './i18n'

function show(chosen = PALETTES[0].id, onChoose: (id: string) => void = () => {}) {
  return render(
    <LanguageProvider>
      <SkyToggle chosen={chosen} onChoose={onChoose} />
    </LanguageProvider>,
  );
}

test('it offers one swatch per sky', () => {
  show();
  expect(screen.getAllByRole('button')).toHaveLength(PALETTES.length);
});

test('the sky in use is the one shown as chosen', () => {
  show(PALETTES[1].id);

  const pressed = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true');
  expect(pressed).toHaveLength(1);
  expect(pressed[0]).toHaveAttribute('data-palette', PALETTES[1].id);
});

test('picking a swatch asks for that sky', async () => {
  const chosen: string[] = [];
  show(PALETTES[0].id, (id) => { chosen.push(id); });

  const wanted = PALETTES[2];
  await userEvent.click(screen.getAllByRole('button').find((b) => b.dataset.palette === wanted.id)!);

  expect(chosen).toEqual([wanted.id]);
});

test('each swatch is named, so the row is not four unlabelled dots', () => {
  show();
  for (const button of screen.getAllByRole('button')) {
    expect(button).toHaveAccessibleName();
  }
});
