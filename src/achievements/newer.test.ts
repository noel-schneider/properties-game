import { CATALOGUE } from './catalogue'
import { emptyLifetime, emptyProgress } from './progress'
import { recordEvent } from './index'
import type { GameEvent, Progress } from './types'

function play(events: GameEvent[]): string[] {
  let progress: Progress = emptyProgress(emptyLifetime());
  const earned: string[] = [];
  for (const event of events) {
    const outcome = recordEvent(progress, event);
    progress = outcome.progress;
    earned.push(...outcome.unlocked.map((a) => a.id));
  }
  return earned;
}

const guess = (over: Partial<Extract<GameEvent, { type: 'guess' }>> = {}): GameEvent => ({
  type: 'guess', at: 1_700_000_000_000, correct: true, property: 'insect',
  exactName: true, selection: ['ant', 'bee', 'moth'], ...over,
});

test('placing a lone concept into a category is its own achievement', () => {
  // The drag is the one move the game never taught and never rewarded.
  expect(play([guess({ selection: ['ladybug'] })])).toContain('placed');
});

test('answering with three does not count as placing one', () => {
  expect(play([guess()])).not.toContain('placed');
});

test('growing a category past its first trio is worth something', () => {
  expect(play([guess({ selection: ['ladybug'], groupSize: 6 })])).toContain('well-grown');
  expect(play([guess({ selection: ['ladybug'], groupSize: 4 })])).not.toContain('well-grown');
});

test('a run of ten is worth more than a run of five', () => {
  const ten = Array.from({ length: 10 }, () => guess());
  const earned = play(ten);

  expect(earned).toContain('streak-of-five');
  expect(earned).toContain('streak-of-ten');
});

test('a run of nine is not a run of ten', () => {
  expect(play(Array.from({ length: 9 }, () => guess()))).not.toContain('streak-of-ten');
});

test('finding a category you had already found is worth noticing', () => {
  const twice = [guess({ property: 'insect' }), guess({ property: 'insect' })];

  expect(play(twice)).toContain('deja-vu');
  expect(play([guess({ property: 'insect' })])).not.toContain('deja-vu');
});

test('every achievement in the catalogue is named in both languages', async () => {
  const [en, fr] = await Promise.all([
    import('../i18n/en.json').then((m) => m.default),
    import('../i18n/fr.json').then((m) => m.default),
  ]);

  for (const achievement of CATALOGUE) {
    for (const locale of [en, fr]) {
      const wording = (locale.achievements as Record<string, { name: string; description: string }>)[achievement.id];
      expect(wording?.name, achievement.id).toBeTruthy();
      expect(wording?.description, achievement.id).toBeTruthy();
    }
  }
});
