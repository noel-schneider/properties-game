import { screen } from '@testing-library/react'
import { renderApp, words } from '../test-utils'
import userEvent from '@testing-library/user-event'
import Panel from './Panel'
import { CATALOGUE } from './catalogue'

const publicOnes = CATALOGUE.filter((a) => !a.secret);
const secretOnes = CATALOGUE.filter((a) => a.secret);

async function open(unlocked: string[] = []) {
  const user = userEvent.setup();
  renderApp(<Panel unlocked={unlocked} muted={false} onToggleMute={() => {}} />);
  await user.click(screen.getByRole('button', { name: /achievements/i }));
  return user;
}

test('the button reports how many are earned out of the total', () => {
  renderApp(<Panel unlocked={['first-light', 'collector']} muted={false} onToggleMute={() => {}} />);

  expect(screen.getByRole('button', { name: /achievements/i })).toHaveTextContent('2 / 15');
});

test('the list is closed until the button is pressed', () => {
  renderApp(<Panel unlocked={[]} muted={false} onToggleMute={() => {}} />);

  expect(screen.queryByRole('dialog')).toBeNull();
});

test('public achievements are named and described even when locked', async () => {
  await open();

  for (const achievement of publicOnes) {
    const wording = words.en.achievements[achievement.id as 'first-light'];
    expect(screen.getByText(wording.name)).toBeInTheDocument();
    expect(screen.getByText(wording.description)).toBeInTheDocument();
  }
});

test('secret achievements give nothing away until they are earned', async () => {
  await open();

  for (const achievement of secretOnes) {
    const wording = words.en.achievements[achievement.id as 'night-owl'];
    expect(screen.queryByText(wording.name)).toBeNull();
    expect(screen.queryByText(wording.description)).toBeNull();
  }
  expect(screen.getAllByText('???')).toHaveLength(secretOnes.length);
});

test('an earned secret achievement is revealed in full', async () => {
  const secret = secretOnes[0];
  await open([secret.id]);
  const wording = words.en.achievements[secret.id as 'night-owl'];

  expect(screen.getByText(wording.name)).toBeInTheDocument();
  expect(screen.getByText(wording.description)).toBeInTheDocument();
  expect(screen.getAllByText('???')).toHaveLength(secretOnes.length - 1);
});

test('earned entries are marked apart from locked ones', async () => {
  await open(['first-light']);

  expect(screen.getByTestId('entry-first-light')).toHaveAttribute('data-earned', 'true');
  expect(screen.getByTestId('entry-collector')).toHaveAttribute('data-earned', 'false');
});

test('the list closes on Escape', async () => {
  const user = await open();

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('the list closes on its close button', async () => {
  const user = await open();

  await user.click(screen.getByRole('button', { name: /close/i }));
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('the sound can be muted from the panel', async () => {
  const onToggleMute = vi.fn();
  const user = userEvent.setup();
  renderApp(<Panel unlocked={[]} muted={false} onToggleMute={onToggleMute} />);

  await user.click(screen.getByRole('button', { name: /mute/i }));
  expect(onToggleMute).toHaveBeenCalled();
});

test('the mute control says what it will do when already muted', () => {
  renderApp(<Panel unlocked={[]} muted onToggleMute={() => {}} />);

  expect(screen.getByRole('button', { name: /unmute/i })).toBeInTheDocument();
});
