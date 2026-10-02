import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SoundToggle from './SoundToggle'
import { renderApp } from './test-utils'

test('it offers to mute while the sound is on', async () => {
  const onToggle = vi.fn();
  const user = userEvent.setup();
  renderApp(<SoundToggle muted={false} onToggle={onToggle} />);

  await user.click(screen.getByRole('button', { name: /mute achievement sound/i }));

  expect(onToggle).toHaveBeenCalledTimes(1);
});

test('it offers to bring the sound back once muted', () => {
  renderApp(<SoundToggle muted onToggle={() => {}} />);

  expect(screen.getByRole('button', { name: /unmute achievement sound/i })).toBeInTheDocument();
});
