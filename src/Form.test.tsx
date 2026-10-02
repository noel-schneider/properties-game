import { render, screen } from '@testing-library/react';
import Form from './Form';

// The graph still renders to a <canvas>, which jsdom cannot paint, so this
// suite covers the form on its own. App is covered end-to-end once the graph
// is rendered as DOM nodes.
test('renders the category input with submit disabled when nothing is selected', () => {
  render(<Form selectedNodes={[]} />);

  expect(screen.getByPlaceholderText(/type a category here/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
});
