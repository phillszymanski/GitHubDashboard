import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ChartWrapper from '../ChartWrapper';

describe('ChartWrapper', () => {
  it('renders title and children when not empty', () => {
    render(
      <ChartWrapper title="Test Chart">
        <div>Chart content</div>
      </ChartWrapper>
    );

    expect(screen.getByText('Test Chart')).toBeInTheDocument();
    expect(screen.getByText('Chart content')).toBeInTheDocument();
  });

  it('renders empty message when isEmpty is true', () => {
    render(
      <ChartWrapper title="Test Chart" isEmpty={true} emptyMessage="No data available">
        <div>Chart content</div>
      </ChartWrapper>
    );

    expect(screen.getByText('Test Chart')).toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(screen.queryByText('Chart content')).not.toBeInTheDocument();
  });

  it('uses default empty message', () => {
    render(
      <ChartWrapper title="Test Chart" isEmpty={true}>
        <div>Chart content</div>
      </ChartWrapper>
    );

    expect(screen.getByText('No data to display')).toBeInTheDocument();
  });
});
