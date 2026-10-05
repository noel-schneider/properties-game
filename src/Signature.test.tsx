import { screen } from '@testing-library/react'
import { renderApp } from './test-utils'
import Signature from './Signature'
import { PORTFOLIO_URL, SUPPORT_URL } from './supporting'

test('says who made it, and leads to them', () => {
  renderApp(<Signature />);

  const by = screen.getByRole('link', { name: /portfolio/i });
  expect(by).toHaveTextContent(/noël/i);
  expect(by).toHaveAttribute('href', PORTFOLIO_URL);
});

test('the way to give is readable, not a riddle', () => {
  renderApp(<Signature />);

  // A cup on its own says nothing about why it is there. The words do.
  const give = screen.getByRole('link', { name: /support the game/i });
  expect(give).toHaveTextContent(/support the game/i);
  expect(give).toHaveAttribute('href', SUPPORT_URL);
});

test('both leave for elsewhere without handing this page over', () => {
  renderApp(<Signature />);

  for (const link of screen.getAllByRole('link')) {
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('rel')).toContain('noreferrer');
  }
});
