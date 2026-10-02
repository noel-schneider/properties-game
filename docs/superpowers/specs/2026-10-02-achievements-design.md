# Achievements — design

**Goal:** reward the player for things worth noticing — skill, persistence, and
the odd way they happen to play — with Steam-style achievements that unlock
during play, announce themselves with a sound and a banner, and survive a
reload.

**Status:** approved in conversation on 2026-10-02.

## Intent

The game is playable but has no reason to keep playing: the score climbs and
nothing else happens. Achievements give the session shape — short-term goals
the player can see, and surprises they cannot.

Two kinds, as asked:

- **public** — name and description visible from the start. They advertise what
  the game rewards and steer how it is played.
- **secret** — shown as locked, nameless slots (`???`) until earned. They reward
  curiosity and odd behaviour rather than performance, so revealing them in
  advance would spoil them.

Success looks like: a player finds their first category, hears a short chime,
sees a banner, and goes looking for the next one. A player who comes back
tomorrow still has what they earned.

### Decided in conversation

- "private" means **hidden Steam-style**, not shareable-to-the-outside. No
  backend, no sharing.
- unlocked achievements **persist in localStorage**. Per browser, no account.
- built on `master` with #7 and #8 already merged.

### Out of scope

No backend, no accounts, no cross-device sync, no sharing. No end-of-game
condition — that stays an open design question, untouched here.

## The catalogue

Fourteen: eight public, six secret.

### Public

| id | name | unlocked by |
|---|---|---|
| `first-light` | First Light | find your first category |
| `hat-trick` | Hat-trick | clear a whole board with no wrong answer |
| `in-your-words` | In Your Words | 10 answers accepted through an alias |
| `streak-of-five` | Streak of Five | 5 correct answers in a row |
| `collector` | Collector | find 20 different categories (lifetime) |
| `quickdraw` | Quickdraw | find a category within 10s of the board appearing |
| `marathon` | Marathon | 25 categories in one session |
| `spotless` | Spotless | clear 3 boards in a row with no wrong answer |

### Secret

| id | name | unlocked by |
|---|---|---|
| `second-guessing` | Second Guessing | toggle the same concept 10 times before answering |
| `scattershot` | Scattershot | 5 wrong answers on one board |
| `big-net` | Big Net | answer correctly with 8 or more concepts selected |
| `word-for-word` | Word for Word | 10 answers typed as the exact property name, never an alias |
| `and-yet` | And Yet | answer correctly right after a wrong answer on the same selection |
| `night-owl` | Night Owl | play between 02:00 and 04:00 local time |

`in-your-words` and `word-for-word` are deliberately opposed: two ways of
playing, each rewarded.

## Architecture

Approach chosen: **event-driven detector**. Rejected alternatives were inline
checks in `App` (turns `App` into a dumping ground; every achievement would
need a React test with simulated clicks) and an external store such as Zustand
(a dependency for fourteen predicates).

```
App  ──emits──▶  GameEvent  ──▶  advance(progress, event)  ──▶  Progress
                                           │
                                           ▼
                                  catalogue predicates
                                           │
                                           ▼
                                  newly unlocked ids
                                     │          │
                                   chime      banner
```

`App` emits events and renders the result. Everything between is pure, so all
fourteen rules are tested by feeding event sequences — no rendering.

**No rule calls `Date.now()`.** The timestamp travels inside the event. That is
what makes `quickdraw` (under 10s) and `night-owl` (02:00–04:00) testable
without touching the system clock.

### Events

```ts
type GameEvent =
  | { type: 'board-dealt'; at: number; groups: number }
  | { type: 'concept-toggled'; name: string }
  | { type: 'guess'; at: number; correct: boolean; property?: string;
      exactName: boolean; selection: string[] }
```

`exactName` is true when the typed answer was the property's own name rather
than one of its aliases. `App` computes it from `matchedProperty` and the
normaliser already in `guess.ts`, which this change exports.

Events are dumb records. Everything derived — streaks, mistakes per board,
whether the board is now clear, whether this selection just failed — belongs to
the reducer, never the caller. That is why `board-dealt` carries how many
groups the board holds: the reducer counts finds against it and knows when the
board is cleared, instead of being told.

`session.toggleCounts` resets on every guess and on every new board, so
`second-guessing` means ten toggles of one concept *before committing to an
answer*, not ten spread across a whole session.

### Progress

```ts
interface Progress {
  lifetime: {                  // persisted
    unlocked: string[];
    propertiesFound: string[];
    aliasAnswers: number;
    exactAnswers: number;
  };
  session: {                   // in memory only
    finds: number;
    streak: number;
    boardMistakes: number;
    cleanBoardsInARow: number;
    boardDealtAt: number;
    toggleCounts: Record<string, number>;
    lastWrongSelection: string[] | null;
  };
}
```

The split is deliberate. `collector` counts 20 *different* categories and would
be unreachable if it reset on reload, so it is lifetime. `marathon` counts 25
in *one session* and would be meaningless if it did not reset, so it is
session. Each counter sits on the side its wording demands.

### Persistence

`storage.ts` reads and writes only `Progress['lifetime']`, under one
localStorage key, and **every access is wrapped in try/catch**. Private
browsing and blocked site data make the accessor throw, and the game must stay
playable with no memory at all — an achievement that cannot be saved is a
missed reward, not a crash.

A stored record that fails to parse, or that names achievements the catalogue
no longer has, is discarded rather than trusted.

### Sound

Synthesised with the Web Audio API, not a bundled file: no asset to source, no
licence question, no bytes added to the bundle.

Two rising notes, A5 (880 Hz) then E6 (1318.5 Hz), sine timbre, fast attack and
roughly 600 ms of decay — a soft bell rather than a video-game blip. The
`AudioContext` is created lazily on first unlock, by which point the player has
already clicked a bubble, so the browser's autoplay gate is satisfied.

A mute toggle sits next to the achievements button and persists with the rest
of the lifetime record.

### Banner

Slides in from the bottom right: icon, name, description. A gold glow pulses
once, and it leaves after 4 seconds. Several unlocking at once stack.

It uses `role="alert"`, **not** `role="status"` — the form's correct/wrong
message already owns `status`, and a second one would make
`getByRole('status')` ambiguous and break the existing tests.

Under `prefers-reduced-motion` the banner appears without sliding or pulsing.

### Panel

A discreet button in the corner opens the list: public achievements with name
and description from the start, secret ones as locked slots marked `???` until
earned, then revealed in full.

This is what makes the public/secret distinction visible at all — without it,
"hidden Steam-style" has nowhere to express itself.

## Files

| file | responsibility |
|---|---|
| `src/achievements/catalogue.ts` | the 14 definitions, each with its predicate |
| `src/achievements/progress.ts` | `advance(progress, event)`, the pure reducer |
| `src/achievements/index.ts` | `recordEvent(progress, event)` → next progress + newly unlocked |
| `src/achievements/storage.ts` | load/save the lifetime record, guarded |
| `src/achievements/chime.ts` | the Web Audio unlock sound |
| `src/achievements/Toast.tsx` | the banner |
| `src/achievements/Panel.tsx` | the list |
| `src/App.tsx` | emits events, renders banner and panel |
| `src/guess.ts` | exports its normaliser so `exactName` can be computed |

## Testing

- **unit, no rendering** — one test per achievement, feeding an event sequence
  to `recordEvent` and asserting what unlocks. Plus the reducer's own
  behaviour: streaks reset on a wrong answer, board counters reset on a new
  board, lifetime counters do not.
- **storage** — a record that round-trips; a corrupted record that is
  discarded; a throwing localStorage that leaves the game playable.
- **integration** — `App` unlocks `first-light` on a correct answer and shows
  the banner; the panel lists public achievements by name and secret ones as
  `???`.
- **e2e** — unlock an achievement in a real browser, see the banner, reload,
  and find it still unlocked in the panel.

**What is not tested:** that a sound actually reaches the speakers. The tests
can assert the unlock pipeline calls the chime, and no more. Verifying the
sound is a human listening to it.

## Delivery

Two pull requests, because one block of this size is unpleasant to review:

1. engine, catalogue, persistence, banner, sound
2. the panel

After the first, achievements unlock and announce themselves but cannot be
browsed. That is coherent on its own — the banner still tells the player what
they earned.
