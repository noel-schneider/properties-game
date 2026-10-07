/**
 * Where the end-to-end suite expects to find the game.
 *
 * A port of its own, away from the 3000 that `npm run dev` uses. Playwright
 * reuses whatever already answers on the address it is given, and it does not
 * ask what that is: when another project's dev server held 3000, the whole
 * suite tested a stranger's login page and failed fifty-two times without ever
 * naming the reason. A port nobody else reaches for keeps that from happening
 * twice, and `serves-the-game.ts` catches it if it does.
 */
export const PORT = 3100

export const BASE_URL = `http://localhost:${PORT}`
