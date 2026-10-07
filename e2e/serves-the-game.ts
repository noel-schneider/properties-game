import { BASE_URL } from './server'

/**
 * Checks that the server answering is this game, before a single test runs.
 *
 * A wrong server is the one failure that explains itself badly: every test
 * times out waiting for a board that was never going to appear, and the output
 * is a wall of timeouts with nothing in it about the real cause. So the suite
 * asks once, up front, and says so plainly.
 *
 * The marker is the module the page loads rather than the title, because the
 * title is prose and prose gets edited; `/src/index.tsx` is the entry Vite
 * serves and the thing that would have to change for this to be a different
 * app.
 */
export default async function servesTheGame() {
  let html: string
  try {
    html = await fetch(BASE_URL).then((r) => r.text())
  } catch (cause) {
    throw new Error(`Nothing answered at ${BASE_URL}. The dev server did not come up.`, { cause })
  }

  if (!html.includes('/src/index.tsx')) {
    throw new Error(
      `Something is listening on ${BASE_URL}, but it is not this game — the page it serves does ` +
        `not load /src/index.tsx. Another project's dev server is probably holding the port. ` +
        `Stop it, or change PORT in e2e/server.ts.`,
    )
  }
}
