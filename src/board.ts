import { getNRandomElements } from './utils'
import { isFinished, isSpent, openProperties } from './game'
import { canJoin } from './join'
import type { Solution } from './hand'
import type { Concept } from './types'

export const GROUP_SIZE = 3;

/**
 * About how many groups should be findable on the board at any time.
 *
 * "About", not exactly: the board shows this count, and topping up to the same
 * number every time would make it a constant the player learns to read rather
 * than something that tells them where they are. The variance comes for free —
 * one concept dealt in can open several groups at once — so the top-up stops
 * at the first concept that reaches the mark rather than aiming for it.
 */
export const WAYS_ON = 3;

/**
 * How many ways on to aim for this time.
 *
 * Drawn rather than fixed. Aiming at the same number every time leaves the
 * count sitting on it about two thirds of the time, which the player reads as
 * a constant — and a constant on screen is either noise or, worse, a tell
 * about how close the board is to running dry.
 */
export function waysWanted(): number {
    return WAYS_ON - 1 + Math.floor(Math.random() * 3);
}

/**
 * How many finished concepts stay on the board behind the active ones.
 *
 * They are kept because seeing your work pile up is the point, and bounded
 * because it cannot be all of them: with every concept and every tie on screen
 * at once the browser locks up outright — 126 bubbles and 312 lines rebuilt
 * sixty times a second is more than React will do. The oldest ones leave.
 */
export const FINISHED_KEPT = 20;

/**
 * The groups that could be found right now: a property still open for three
 * of the concepts on the board.
 *
 * A property may be found more than once, with different members — that is
 * what lets the concepts dealt later ever be finished — so what matters is not
 * whether the property has been found but whether it is open for these three.
 */
export function formableGroups(
    board: string[],
    pool: Concept[],
    found: Solution[],
): Solution[] {
    const byName = new Map(pool.map((concept) => [concept.name, concept]));
    const open = new Map<string, string[]>();

    for (const name of board) {
        const concept = byName.get(name);
        if (!concept) continue;

        for (const property of openProperties(concept, found)) {
            open.set(property, [...(open.get(property) ?? []), name]);
        }
    }

    return [...open.entries()]
        .filter(([, names]) => names.length >= GROUP_SIZE)
        .map(([property, names]) => ({ property, concepts: names.slice(0, GROUP_SIZE) }));
}

/** Concepts that could still be used for something, in a shuffled order. */
function stillUseful(pool: Concept[], found: Solution[], exclude: Set<string>): Concept[] {
    return getNRandomElements(
        pool.filter((concept) => !exclude.has(concept.name) && !isFinished(concept, found)),
        pool.length,
    );
}

/**
 * Deals concepts in until there are about `ways` groups to be found.
 *
 * What is topped up is the number of moves available, not the number of
 * concepts on the board. Counting concepts was the old rule and it measured
 * the wrong thing: fifteen taken at random hold 2.4 findable groups on average
 * and sometimes none at all, so the board could be full and unplayable, or
 * thin and generous, with nothing to say which.
 *
 * It stops at the first concept that reaches the mark rather than aiming for
 * it exactly, so the count the board shows lands a little differently each
 * time. A count that is always the same number is one the player stops reading.
 */
export function refill(
    board: string[],
    pool: Concept[],
    found: Solution[],
    ways: number,
): string[] {
    const byName = new Map(pool.map((concept) => [concept.name, concept]));
    const next = [...board];
    const present = new Set(next);

    // Walked once. Late in a game the mark cannot be reached at all, and the
    // answer then is a board with whatever is left on it, not every concept in
    // the game dealt out looking for a group that does not exist.
    for (const concept of stillUseful(pool, found, present)) {
        if (formableGroups(next, pool, found).length >= ways) break;
        if (present.has(concept.name)) continue;

        next.push(concept.name);
        present.add(concept.name);
    }

    return trim(next, byName, found, pool);
}

/**
 * Deals one concept in, because something was just found.
 *
 * One, every time, visibly: a find that changes nothing on the board gives a
 * player nothing to feel. Topping up to a number of moves available — which is
 * what `refill` does, and still does for a board being built from nothing —
 * meant a find often dealt no concept at all, because the board already had
 * enough ways on it.
 *
 * With a floor under it, though. The old rule counted concepts and measured
 * the wrong thing: fifteen taken at random hold 2.4 findable groups on average
 * and sometimes none, so a board could be full and unplayable. So one concept
 * for the find, and then as many as it takes to leave at least one move on the
 * board. The floor is almost never reached; when it is, it is the difference
 * between a game and a wall.
 */
export function topUp(board: string[], pool: Concept[], found: Solution[]): string[] {
    const byName = new Map(pool.map((concept) => [concept.name, concept]));
    const next = [...board];
    const present = new Set(next);
    let dealt = 0;

    // Walked once, and no further: late in a game there may be nothing useful
    // left at all, and the answer then is the board as it stands rather than a
    // search for a move that does not exist.
    for (const concept of stillUseful(pool, found, present)) {
        if (dealt >= 1 && formableGroups(next, pool, found).length > 0) break;

        next.push(concept.name);
        present.add(concept.name);
        dealt++;
    }

    return trim(next, byName, found, pool);
}

/** Drops the finished concepts that have been sitting there longest. */
function trim(
    board: string[],
    byName: Map<string, Concept>,
    found: Solution[],
    pool: Concept[],
): string[] {
    const finished = board.filter((name) => {
        const concept = byName.get(name);
        return concept && isSpent(concept, found, pool);
    });
    if (finished.length <= FINISHED_KEPT) return board;

    const leaving = new Set(finished.slice(0, finished.length - FINISHED_KEPT));
    return board.filter((name) => !leaving.has(name));
}

/**
 * Whether the game has nothing left to do at all.
 *
 * Not the same as having no trio to form. A category of N members strands N
 * mod 3 concepts, and those are placed one at a time by dropping them into a
 * group already found — measured at fourteen such moves still waiting at the
 * point where no trio can be made anywhere. Calling the game over there ends
 * it fourteen moves early, which this exists to stop.
 */
export function isExhausted(pool: Concept[], found: Solution[]): boolean {
    if (formableGroups(pool.map((concept) => concept.name), pool, found).length > 0) return false;

    return !pool.some((concept) => found.some((group) => canJoin(concept, group, found)));
}

/**
 * A board to start from, dealt.
 *
 * It used to be written down, because a first board dealt at random is
 * sometimes a wall — three obscure categories and nothing a newcomer can
 * name — and the first thing anybody meets should not be decided by a throw.
 *
 * What it was instead was the same wall every time. All four of its trios
 * answered to two names at once: chocolate, honey and cake are food *and*
 * sweet; ant, bee and ladybug are insect *and* animal; key, coin and watch
 * are object *and* metal; snow, igloo and glacier are cold *and* white. Four
 * of its five formable trios carried a second name, so a player's first
 * lesson was that the game wanted one of two right answers and would not say
 * which. Dealt boards carry a second name on about one trio in twenty-five,
 * and none of them is doubled all the way through.
 *
 * The half of the old reasoning that was right is kept by `refill`, which
 * tops the deal up until there are moves on the board. What is given up is
 * the promise that the first categories are easy ones — measured against a
 * first board that was teaching the wrong thing, that is a trade worth
 * making.
 */
export function openingBoard(pool: Concept[], ways: number): string[] {
    const first = getNRandomElements(pool, OPENING_SCATTER).map((concept) => concept.name);
    return refill(first, pool, [], ways);
}

/** How many concepts a board opens with before it is topped up. */
export const OPENING_SCATTER = 9;
