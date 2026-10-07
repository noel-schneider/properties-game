import { expect, test } from '@playwright/test'
import { boardSettled, clearGame } from './board'
import english from '../src/i18n/en.json' with { type: 'json' }
import data from '../src/concepts.json' with { type: 'json' }


const properties = data as Record<string, string[]>

/** Three concepts on screen that share a property, plus that property. */
function findSolvableTriple(dealt: string[]): { names: string[]; property: string } {
  for (let a = 0; a < dealt.length; a++) {
    for (let b = a + 1; b < dealt.length; b++) {
      for (let c = b + 1; c < dealt.length; c++) {
        const triple = [dealt[a], dealt[b], dealt[c]]
        const property = properties[triple[0]].find((p) =>
          triple.every((name) => properties[name].includes(p)),
        )
        if (property) return { names: triple, property }
      }
    }
  }
  throw new Error('the dealt hand has no solvable triple, which dealHand should prevent')
}

test('naming the shared category is accepted', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)

  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const { names, property } = findSolvableTriple(dealt)

  for (const name of names) {
    await page.getByRole('checkbox', { name, exact: true }).click()
  }
  await page.locator('.input').fill(property)
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByRole('status')).toHaveText(/correct/i)
})

test('a wrong category is rejected', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)

  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const { names } = findSolvableTriple(dealt)

  for (const name of names) {
    await page.getByRole('checkbox', { name, exact: true }).click()
  }
  await page.locator('.input').fill('not a real category at all')
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByRole('status')).toHaveText(/not a category/i)
})

test('pressing Enter submits the guess', async ({ page }) => {
  await page.goto('/')
  await boardSettled(page)

  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const { names, property } = findSolvableTriple(dealt)

  for (const name of names) {
    await page.getByRole('checkbox', { name, exact: true }).click()
  }
  await page.locator('.input').fill(property)
  await page.locator('.input').press('Enter')

  await expect(page.getByRole('status')).toHaveText(/correct/i)
})

test('a found group stays on the board, tied and named, and its concepts carry on', async ({ page }) => {
  // Start from a clean record, then read the board that comes with it.
  await page.goto('/')
  await boardSettled(page)
  await clearGame(page)
  await page.reload()
  await boardSettled(page)
  await expect(page.getByTestId('found')).toHaveText('0')

  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const { names, property } = findSolvableTriple(dealt)

  for (const name of names) {
    await page.getByRole('checkbox', { name, exact: true }).click()
  }
  await page.locator('.input').fill(property)
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByRole('status')).toHaveText(/correct/i)
  await expect(page.getByTestId('found')).toHaveText('1')

  // The three stay on the board, tied together, and keep whatever properties
  // they have not spent yet.
  for (const name of names) {
    await expect(page.getByLabel(name, { exact: true })).toBeVisible()
  }
  await expect(page.locator('.found__loop')).toHaveCount(1)
  await expect(page.locator('.found__label')).toHaveText(property)
  await expect(page.locator('.input')).toHaveValue('')
})

test('a concept can be dropped onto a category already found', async ({ page }) => {
  // The scenario is worked out here rather than played for: a category only
  // comes up twice late in a game, and playing forty-odd rounds to reach one
  // took minutes and found a repeat only sometimes.
  const label = (id: string) => (english.concepts as Record<string, string>)[id] ?? id
  // `properties` is the game's own data file, already read at the top of this
  // file for the other tests.
  const holders = new Map<string, string[]>()
  for (const [name, has] of Object.entries(properties)) {
    for (const property of has) {
      holders.set(property, [...(holders.get(property) ?? []), name])
    }
  }
  const roomy = [...holders.entries()].filter(([, names]) => names.length >= 6)
  expect(roomy.length, 'no category has enough members to join one').toBeGreaterThan(0)

  // Seed a found group, then take the joiner from whatever the board deals
  // beside it — the board is rebuilt from what has been found, so which
  // concepts come back cannot be dictated.
  let scenario: { property: string; host: string[]; joiner: string } | undefined
  for (const [property, names] of roomy) {
    const host = names.slice(0, 3)
    await page.goto('/')
    await page.evaluate(
      ([key, group]) => {
        localStorage.setItem(key as string, JSON.stringify([group]))
        // The board is kept between visits now, so a seeded game has to clear
        // it or the last one is restored over the top.
        localStorage.removeItem('properties-game:board')
      },
      ['properties-game:found', { property, concepts: host }] as const,
    )
    await page.reload()
    await boardSettled(page)

    const onBoard = await page.locator('.bubble').evaluateAll(
      (bubbles) => bubbles.map((b) => b.getAttribute('aria-label') ?? ''),
    )
    const joiner = names.slice(3).find((name) => onBoard.includes(label(name)))
    if (joiner && host.every((name) => onBoard.includes(label(name)))) {
      scenario = { property, host, joiner }
      break
    }
  }
  expect(scenario, 'no board dealt a concept that could join the seeded group').toBeDefined()
  const { property, host, joiner } = scenario!

  const middleOf = async (names: string[]) => {
    const boxes = await Promise.all(
      names.map((name) => page.locator(`.bubble[aria-label="${label(name)}"]`).boundingBox()),
    )
    return {
      x: boxes.reduce((sum, b) => sum + b!.x + b!.width / 2, 0) / boxes.length,
      y: boxes.reduce((sum, b) => sum + b!.y + b!.height / 2, 0) / boxes.length,
    }
  }

  // What moves: the joiner spends one more of its properties, and the tally of
  // answers got right goes up by one. That tally used to count groups alone,
  // so this move — twelve per cent of the answers in a game — landed with
  // nothing on screen to show for it.
  const spent = async () => Number(
    (await page.locator(`.bubble[aria-label="${label(joiner)}"]`).getAttribute('data-progress'))!.split('/')[0],
  )
  const finds = async () => Number(await page.getByTestId('found').textContent())
  const before = await spent()
  const findsBefore = await finds()

  const from = await middleOf([joiner])
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()

  // Two things make a first aim miss, and a player meets both: dragging
  // reheats the simulation so the group drifts away under the pointer, and
  // where groups overlap a tighter neighbour can be the nearer target. The
  // offer says which group would take it, so the answer is to nudge until it
  // names the one wanted — which is exactly what the offer is for.
  const offered = () => page.locator('.drop-hint').textContent().catch(() => null)
  let aimed = false
  for (let nudge = 0; nudge < 12 && !aimed; nudge++) {
    const now = await middleOf(host)
    const sway = nudge === 0 ? 0 : 16 * (nudge % 2 === 0 ? 1 : -1) * Math.ceil(nudge / 2)
    await page.mouse.move(now.x + sway, now.y + sway / 2, { steps: 5 })
    aimed = ((await offered()) ?? '').includes(property)
  }
  expect(aimed, 'never managed to aim at the wanted group').toBe(true)

  // The group being offered to is lit, so the offer and the thing it is
  // offering are read in one glance.
  for (const name of host) {
    await expect(page.locator(`.bubble[aria-label="${label(name)}"]`)).toHaveClass(/bubble--target/)
  }
  await expect(page.locator(`.bubble[aria-label="${label(joiner)}"]`)).not.toHaveClass(/bubble--target/)

  // And the offer is in front of everything: it is what the player reads
  // while deciding whether to let go, so no bubble may cover it.
  const inFront = await page.locator('.graph').evaluate((graph) => {
    const drawn = [...graph.querySelectorAll('.bubble, .drop-hint')]
    const hint = drawn.findIndex((el) => el.classList.contains('drop-hint'))
    const lastBubble = drawn.map((el) => el.classList.contains('bubble')).lastIndexOf(true)
    return hint > lastBubble
  })
  expect(inFront).toBe(true)

  await page.mouse.up()

  await expect(page.getByRole('status')).toHaveText(/correct/i)
  await expect.poll(spent).toBe(before + 1)
  await expect.poll(finds).toBe(findsBefore + 1)
})

test('a category found joins a list that stays on screen', async ({ page }) => {
  await page.goto('/')
  await clearGame(page)
  await page.reload()
  await boardSettled(page)

  // Nothing named yet, so there is nothing to list.
  await expect(page.locator('.sheet')).toHaveCount(0)

  const dealt = await page.getByRole('checkbox').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label')!),
  )
  const { names, property } = findSolvableTriple(dealt)
  for (const name of names) {
    await page.getByRole('checkbox', { name, exact: true }).click()
  }
  await page.locator('.input').fill(property)
  await page.getByRole('button', { name: 'Submit' }).click()

  // And it is open from then on, without being asked for.
  await expect(page.locator('.sheet')).toBeVisible()
  await expect(page.locator('.sheet__row')).toHaveCount(1)
  await expect(page.getByTestId('properties-done')).toHaveText('0 / 1')
})
