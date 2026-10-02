import './SkyToggle.css'
import { PALETTES } from './sky/palettes'
import { useTranslator } from './i18n'

interface SkyToggleProps {
    chosen: string;
    onChoose: (id: string) => void;
}

/**
 * Picks the sky behind the board.
 *
 * Four swatches side by side rather than one button cycling through them:
 * choosing between backgrounds means comparing them, and a cycle shows one at
 * a time with no way back except going all the way round.
 */
function SkyToggle({ chosen, onChoose }: SkyToggleProps) {
    const { t } = useTranslator();

    return (
        <div className="skies" role="group" aria-label={t('sky.group')}>
            {PALETTES.map((palette) => {
                const name = t(`sky.${palette.id}` as 'sky.abyss');

                return (
                    <button
                        key={palette.id}
                        type="button"
                        className={
                            palette.id === chosen
                                ? 'control control--icon skies__swatch skies__swatch--on'
                                : 'control control--icon skies__swatch'
                        }
                        data-palette={palette.id}
                        onClick={() => onChoose(palette.id)}
                        aria-pressed={palette.id === chosen}
                        aria-label={name}
                        title={name}
                        // The swatch wears the palette it offers, so the row is a
                        // preview rather than four identical buttons.
                        style={{
                            '--swatch-deep': palette.deep,
                            '--swatch-one': palette.washes[0].rgb,
                            '--swatch-two': palette.washes[1].rgb,
                        } as React.CSSProperties}
                    />
                );
            })}
        </div>
    );
}

export default SkyToggle;
