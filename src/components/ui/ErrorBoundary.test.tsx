import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

import { ErrorBoundary } from './ErrorBoundary';

function Boom({ explode }: { explode: boolean }) {
  if (explode) throw new Error('boom');
  return <p>All good</p>;
}

describe('ErrorBoundary', () => {
  // React logs caught render errors; keep test output quiet
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the default section fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom explode />
      </ErrorBoundary>
    );
    expect(
      screen.getByText('Something went wrong loading this section.')
    ).toBeInTheDocument();
  });

  it('renders a custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<p>Route failed</p>}>
        <Boom explode />
      </ErrorBoundary>
    );
    expect(screen.getByText('Route failed')).toBeInTheDocument();
  });

  it('clears the error when resetKey changes', () => {
    const { rerender } = render(
      <ErrorBoundary resetKey='/broken' fallback={<p>Route failed</p>}>
        <Boom explode />
      </ErrorBoundary>
    );
    expect(screen.getByText('Route failed')).toBeInTheDocument();

    rerender(
      <ErrorBoundary resetKey='/working' fallback={<p>Route failed</p>}>
        <Boom explode={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });
});
