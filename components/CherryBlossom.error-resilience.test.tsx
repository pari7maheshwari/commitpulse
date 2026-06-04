import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import type { ReactNode } from 'react';

import CherryBlossom from './CherryBlossom';

/**
 * hoist-safe mock
 */
const motionDivMock = vi.hoisted(() => vi.fn());

vi.mock('framer-motion', () => ({
  motion: {
    div: motionDivMock,
  },
}));

const mockTelemetryTracker = vi.fn();

function FallbackUI({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div data-testid="error-recovery-panel">
      <h2>Cherry Blossom Rendering Failed</h2>
      <p>{error instanceof Error ? error.message : String(error)}</p>

      <button onClick={resetErrorBoundary}>Retry Loading Animation</button>
    </div>
  );
}

describe('CherryBlossom — Error Resilience', () => {
  beforeEach(() => {
    motionDivMock.mockReset();
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * 1. Hydration stability
   */
  it('renders safely after hydration', async () => {
    motionDivMock.mockImplementation(({ children }: { children?: ReactNode }) => (
      <div>{children}</div>
    ));

    render(
      <ErrorBoundary FallbackComponent={FallbackUI}>
        <CherryBlossom />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
    });
  });

  /**
   * 2. Exception safety
   */
  it('does not crash when rendering errors occur', async () => {
    motionDivMock.mockImplementation(() => {
      throw new Error('Animation failure');
    });

    expect(() =>
      render(
        <ErrorBoundary FallbackComponent={FallbackUI}>
          <CherryBlossom />
        </ErrorBoundary>
      )
    ).not.toThrow();
  });

  /**
   * 3. Fallback UI
   */
  it('renders fallback UI on failure', async () => {
    motionDivMock.mockImplementation(() => {
      throw new Error('Crash');
    });

    render(
      <ErrorBoundary FallbackComponent={FallbackUI}>
        <CherryBlossom />
      </ErrorBoundary>
    );

    expect(await screen.findByTestId('error-recovery-panel')).toBeInTheDocument();
  });

  /**
   * 4. Telemetry logging
   */
  it('logs errors via onError callback', async () => {
    motionDivMock.mockImplementation(() => {
      throw new Error('Telemetry error');
    });

    render(
      <ErrorBoundary onError={mockTelemetryTracker} FallbackComponent={FallbackUI}>
        <CherryBlossom />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(mockTelemetryTracker).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * 5. Retry/reset flow
   */
  it('supports retry/reset recovery', async () => {
    motionDivMock.mockImplementation(() => {
      throw new Error('Retry error');
    });

    const onReset = vi.fn();

    render(
      <ErrorBoundary onReset={onReset} FallbackComponent={FallbackUI}>
        <CherryBlossom />
      </ErrorBoundary>
    );

    fireEvent.click(await screen.findByRole('button', { name: /retry/i }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
