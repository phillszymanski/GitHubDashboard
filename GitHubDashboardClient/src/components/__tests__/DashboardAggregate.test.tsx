import { render, screen } from '@testing-library/react';
import DashboardAggregate from '../DashboardAggregate';

describe('DashboardAggregate (TDD step 1)', () => {
  it('renders username input and fetch button', () => {
    render(<DashboardAggregate />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fetch/i })).toBeInTheDocument();
  });
});
