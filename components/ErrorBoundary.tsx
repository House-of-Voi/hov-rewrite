'use client';

import { Component, ReactNode } from 'react';
import Button from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child component tree.
 * Displays a fallback UI and provides a retry mechanism.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center space-y-6 animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-error-100 dark:bg-error-900/30 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-error-600 dark:text-error-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
                Something went wrong
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                We encountered an unexpected error. Please try again.
              </p>
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-neutral-500 dark:text-neutral-500 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300">
                    Technical details
                  </summary>
                  <pre className="mt-2 text-xs bg-neutral-100 dark:bg-neutral-800 p-3 rounded overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="primary" size="md" onClick={this.handleReset}>
                Try Again
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => (window.location.href = '/')}
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight error fallback for less critical sections
 */
export function SimpleErrorFallback({
  error,
  reset,
}: {
  error?: Error;
  reset?: () => void;
}) {
  return (
    <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-6 animate-in fade-in duration-300">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 text-error-600 dark:text-error-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-error-800 dark:text-error-300 mb-1">
            Failed to load content
          </h4>
          <p className="text-sm text-error-700 dark:text-error-400 mb-3">
            {error?.message || 'An unexpected error occurred'}
          </p>
          {reset && (
            <Button variant="outline" size="sm" onClick={reset}>
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
