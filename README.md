# Properties

A word game about what things have in common.

The board deals you concepts — a crocodile, an igloo, a bell. Pick three that
share a category and name it: *reptile*, *cold*, *metal*. Get it right and the
three are tied together on the board, and one more concept is dealt in.

The catch is that every concept has several categories. A crocodile is a
reptile, an animal, a danger and a creature of the water, and each of those can
only be used once by that crocodile. So a concept you have already used comes
back, waiting for different company. The game is over when all hundred of them
have given everything they have.

Play it: https://properties.noel-schneider.eu

## Playing

- **Pick three concepts that share a category, then name it.** Both spellings,
  synonyms and near-misses are accepted — *nature* for *biome*, *noise* for
  *sound*.
- **Press Enter anywhere** to put the cursor in the box.
- **Point at a concept** — or hold it with a finger — to see what it already
  shares with its neighbours.
- **Drag a concept onto a category you have found** to add it there, which is
  how the last few are placed once no trio can be made.
- **The ring around a concept fills** as you find the categories it belongs to.
- **Click the empty board** — or press Escape — to put a whole selection back.
- **Ask for a hint** when you are stuck: two concepts that go together light up,
  and naming what they share is left to you. Nothing is ever volunteered.
- **The categories you have named** are listed down the left for the whole game.

Nothing is sent anywhere. What you have found, the board you left, your
achievements and your settings live in your browser's local storage, and
nowhere else.

## The data

A hundred concepts, fifty categories, 307 tags between them — three on
average. It is in [`src/concepts.json`](src/concepts.json), with the two
languages in [`src/i18n`](src/i18n).

The shape of it is held by tests rather than by hand: every category has at
least three members, no two categories hold exactly the same concepts, every
concept carries between two and five, and the number of concepts that can never
be part of a trio is capped. A whole game is about ninety-five answers.

## Running it

```sh
npm install
npm run dev        # http://localhost:3000
```

```sh
npm test           # 537 unit tests
npm run test:e2e   # 57 end-to-end tests, in a real browser
npm run typecheck
npm run build
```

The end-to-end suite starts the dev server itself, on port 3100 rather than the
3000 `npm run dev` uses, so the two never fight over it. The unit tests run in
jsdom, which has no audio and no layout, so anything that needs either — the
music, the water lit from above, what a crowded board does to itself — is
pinned in the browser instead.

## How it is built

Vite, React and TypeScript, with [d3-force](https://d3js.org/d3-force) laying
the board out. No backend, no accounts, no analytics.

The sound is synthesised rather than bundled: the note that answers a right
guess, the chime behind an achievement, and a five-part ambient bed that grows
an instrument every twenty concepts finished. No audio files, no licences, and
nothing that loops.

## Supporting it

The game is free and always will be. If it was worth your evening there is a
coffee cup in the corner: [ko-fi.com/noeldesv](https://ko-fi.com/noeldesv).

Built by [Noël](https://www.noel-schneider.eu).
