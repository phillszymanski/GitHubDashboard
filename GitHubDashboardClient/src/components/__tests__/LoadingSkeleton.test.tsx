import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingSkeleton from '../LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('renders with default props', () => {
    render(<LoadingSkeleton />);
    const skeleton = screen.getByRole('status', { name: 'Loading' });
    expect(skeleton).toBeInTheDocument();
  });

  it('renders multiple skeletons when count is specified', () => {
    render(<LoadingSkeleton count={3} />);
    const skeletons = screen.getAllByRole('status', { name: 'Loading' });
    expect(skeletons).toHaveLength(3);
  });

  it('applies custom dimensions', () => {
    render(<LoadingSkeleton width="200px" height="50px" />);
    const skeleton = screen.getByRole('status', { name: 'Loading' });
    expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
  });
});
