# Achievements Implementation Plan

> **For agentic workers:** steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** unlock Steam-style achievements during play, announce each with a
chime and a banner, and keep them across reloads.

**Architecture:** `App` emits dumb `GameEvent` records; a pure reducer folds
them into `Progress`; each catalogue entry is a pure predicate over that
progress. React only emits and renders. No rule reads the clock — the
timestamp travels in the event.

**Tech Stack:** TypeScript 7, React 19, Vitest 5, Playwright, Web Audio API.

**Spec:** `docs/superpowers/specs/2026-10-02-achievements-design.md`

## Global Constraints

- No new runtime dependency. The chime is synthesised, not bundled.
- Every `localStorage` access is wrapped in `try/catch`; the game stays
  playable when storage throws or is empty.
- The banner uses `role="alert"`. `role="status"` is taken by the form's
  correct/wrong message and a second one breaks existing tests.
- No rule calls `Date.now()`; `at` comes in on the event.
- `strict`, `noUnusedLocals`, `noUnusedParameters` stay on.

## Review Focus

Input classes the spec implies but no single task obviously owns. Each gets a
test in the task named.

1. **A guess arriving before any `board-dealt`** — `quickdraw` must not unlock
   on an undefined board time. (Task 2)
2. **An already-unlocked achievement re-satisfying its predicate** — it must
   not re-announce on every later guess. (Task 3)
3. **A stored record naming an achievement the catalogue dropped** — must be
   discarded, not rendered as an unknown entry. (Task 4)
4. **`localStorage.getItem` throwing** — private browsing; the game must still
   start and still play. (Task 4)
5. **Two achievements unlocking on the same guess** — both must announce, not
   just the first. (Task 3)

---

### Task 1: Catalogue and types

**Files:** create `src/achievements/types.ts`, `src/achievements/catalogue.ts`;
test `src/achievements/catalogue.test.ts`

**Produces:** `GameEvent`, `Progress`, `Achievement`, `CATALOGUE`.

- [ ] Write a failing test: the catalogue holds 14 entries, ids are unique, 8
      are public and 6 secret, and every entry has a name, description and icon.
- [ ] Run it, watch it fail on the missing module.
- [ ] Write the types and the 14 entries with their predicates.
- [ ] Run it green. Commit.

### Task 2: The reducer

**Files:** create `src/achievements/progress.ts`; test
`src/achievements/progress.test.ts`

**Consumes:** `GameEvent`, `Progress` from Task 1.
**Produces:** `emptyProgress()`, `advance(progress, event): Progress`.

- [ ] Failing tests, one behaviour each: a correct guess raises finds, streak
      and lifetime counters; a wrong guess resets the streak and raises board
      mistakes; `board-dealt` resets board counters and stores `boardDealtAt`;
      `concept-toggled` counts per concept and resets on a guess; a correct
      guess records the property once in `propertiesFound`; **a guess with no
      preceding `board-dealt` leaves `quickdraw`'s input unset** (Review Focus 1).
- [ ] Run, watch each fail.
- [ ] Implement `advance`. Run green. Commit.

### Task 3: Unlock detection

**Files:** create `src/achievements/index.ts`; test
`src/achievements/index.test.ts`

**Consumes:** Task 1 and 2.
**Produces:** `recordEvent(progress, event): { progress, unlocked: Achievement[] }`.

- [ ] Failing tests: one per achievement, feeding the event sequence that earns
      it and asserting its id comes back; **an already-unlocked achievement
      does not come back again** (Review Focus 2); **two achievements unlocking
      on one guess both come back** (Review Focus 5).
- [ ] Run, watch them fail.
- [ ] Implement. Run green. Commit.

### Task 4: Persistence

**Files:** create `src/achievements/storage.ts`; test
`src/achievements/storage.test.ts`

**Produces:** `loadLifetime(): Progress['lifetime']`, `saveLifetime(lifetime)`.

- [ ] Failing tests: a record round-trips; unparseable JSON yields the empty
      record; **ids absent from the catalogue are dropped** (Review Focus 3);
      **a throwing `localStorage` yields the empty record instead of
      propagating** (Review Focus 4).
- [ ] Run, watch them fail.
- [ ] Implement with try/catch on both sides. Run green. Commit.

### Task 5: Chime

**Files:** create `src/achievements/chime.ts`

**Produces:** `playUnlockChime()`.

- [ ] Write it: lazy `AudioContext`, two sine notes at 880 Hz and 1318.5 Hz,
      fast attack, ~600 ms decay, no-op when the context cannot be created.
- [ ] No unit test asserts audible output — the integration test in Task 7
      asserts it is *called*. Say so in the commit.

### Task 6: Banner

**Files:** create `src/achievements/Toast.tsx`, `src/achievements/Toast.css`;
test `src/achievements/Toast.test.tsx`

- [ ] Failing tests: renders name and description under `role="alert"`;
      renders several stacked; calls `onDismiss` after its delay.
- [ ] Run, watch fail. Implement, including the `prefers-reduced-motion`
      branch. Run green. Commit.

### Task 7: Wire into App

**Files:** modify `src/App.tsx`, `src/guess.ts` (export the normaliser); test
`src/App.test.tsx`

- [ ] Failing tests: a first correct answer shows the First Light banner;
      a wrong answer shows none; the chime is called once per unlock (inject it).
- [ ] Run, watch fail. Emit `board-dealt` on deal and `guess` on submit, feed
      `recordEvent`, render the banner, save the lifetime record. Run green.
- [ ] Full suite plus `npm run typecheck`. Commit.

### Task 8: End to end

**Files:** create `e2e/achievements.spec.ts`

- [ ] Unlock First Light in a real browser, see the banner, reload, and assert
      it is still unlocked.
- [ ] Run `npm run test:e2e`. Commit, open the PR.

---

Panel ships in a second PR, per the spec's delivery section.
