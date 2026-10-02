# A board that stays — design

**Goal:** concepts stay on the board instead of arriving in waves of fifteen. A
concept can be used in as many groups as it has properties, and once every one
of them has been found it shrinks and fades, finished.

**Status:** approved in conversation on 2026-10-02.

## What changes, and why

The game's idea is that one object has several properties. Today a found
concept is **locked** and can never serve again — a rule I introduced with the
found-group clusters. Under that rule a concept with four properties is spent
after one, which contradicts the idea. So:

- a concept carries its properties one by one. A group of three uses **one**
  property from each of its three members
- a property may be found **more than once**, with different members: `biome`
  with jungle/desert/forest, then again with tundra/savanna/swamp. Otherwise
  the second batch of concepts could never be finished
- a concept is **finished** when every property it has was part of a found
  group. It then shrinks and turns semi-transparent, and stops being selectable

### Decided in conversation

- about fifteen unfinished concepts are kept on the board; when one finishes, a
  new one arrives
- the run ends when every concept is finished
- found groups keep their permanent ties and label

### Measured first

- a frozen board of fifteen holds **2.4 formable groups on average, sometimes
  zero**, so the board has to be refilled or it dries up after two answers
- finishing all 126 concepts takes **~127 groups**: 380 properties, three per
  group. Far longer than the 32 boards it replaces.

## State

```ts
interface Game {
  board: string[];          // concepts on screen, finished ones included
  found: Solution[];        // every group found, in order
}
```

Everything else is derived, so there is one source of truth and nothing to keep
in step:

- `donePropertiesOf(name)` — the properties of `name` that appear in a found
  group containing it
- `isFinished(name)` — every property of `name` is done
- `openProperties(name)` — what it can still be used for

## Rules

A guess is accepted when the selected concepts all share a property **that is
undone for every one of them**. Naming a property that two of them have already
spent is refused: it would advance nothing.

The board is refilled until the unfinished concepts on it can form at least one
group for an undone property. That check runs after every change, so the player
can never be stuck looking at a board with no answer.

## What is stored

`found` alone, under its own key. The board is rebuilt from it on load: the
concepts on screen are a presentation detail, what was found is the game.

## Testing

- the model, with no rendering: a concept used twice, a property found twice, a
  concept finishing, a guess refused because a member has spent that property
- the refill guarantee, over many boards: there is always a formable group
- the whole run reaches its end, simulated rather than clicked
