/**
 * The skies the board can sit on.
 *
 * A wash is given as a bare "r, g, b" triplet and an alpha rather than a
 * finished colour, because the stylesheet builds a nine-stop ramp from it:
 * fading a saturated colour out to `transparent` fades it through transparent
 * *black*, which paints a visible grey ring where the wash ends. Fading to
 * rgba(same colour, 0) is what keeps the edge invisible.
 */
export interface Wash {
    /** "r, g, b", for rgba(var(--wash), a). */
    rgb: string;
    /** How strong the wash is at its centre. */
    alpha: number;
}

export interface Palette {
    /** Stable id. The displayed name is a translation of it. */
    id: string;
    /** The glow at the top of the frame. */
    sky: string;
    /** The bottom of the frame, where it goes almost black. */
    deep: string;
    washes: [Wash, Wash, Wash];
}

export const PALETTES: Palette[] = [
    {
        id: 'abyss',
        sky: '#0a1020',
        deep: '#04060c',
        washes: [
            { rgb: '54, 122, 224', alpha: 0.3 },
            { rgb: '46, 196, 208', alpha: 0.24 },
            { rgb: '96, 110, 230', alpha: 0.18 },
        ],
    },
    {
        id: 'aurora',
        sky: '#0b1410',
        deep: '#05070a',
        washes: [
            { rgb: '64, 224, 160', alpha: 0.3 },
            { rgb: '58, 170, 214', alpha: 0.26 },
            { rgb: '120, 230, 190', alpha: 0.14 },
        ],
    },
    {
        id: 'neon',
        sky: '#120a1c',
        deep: '#05040a',
        washes: [
            { rgb: '226, 78, 178', alpha: 0.26 },
            { rgb: '128, 82, 232', alpha: 0.3 },
            { rgb: '70, 196, 224', alpha: 0.16 },
        ],
    },
    {
        id: 'ember',
        sky: '#17100c',
        deep: '#060405',
        washes: [
            { rgb: '224, 118, 64', alpha: 0.24 },
            { rgb: '186, 58, 96', alpha: 0.26 },
            { rgb: '120, 60, 180', alpha: 0.16 },
        ],
    },
];

/** Cold and blue: it leaves the orange of the group names alone. */
export const DEFAULT_PALETTE = 'abyss';

export function isPalette(value: unknown): value is string {
    return typeof value === 'string' && PALETTES.some((palette) => palette.id === value);
}

export function paletteOf(id: string): Palette {
    return PALETTES.find((palette) => palette.id === id) ?? PALETTES[0];
}
