import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary — keeps a thrown render error from blanking the
 * whole SPA and offers a branded recovery path.
 *
 * Two ways out, because they are different needs: "try again" re-renders the
 * tree in place (a transient fault — a bad payload, a stale closure — may not
 * happen twice), and "back to home" leaves the broken route entirely.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Unhandled UI error:', error, info.componentStack);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-surface px-6 text-center text-ink">
        <p className="font-heading text-xs uppercase tracking-[0.32em] text-gold">
          Kadamba&apos;s Designer Studio
        </p>
        <h1 className="font-heading text-3xl text-ink sm:text-4xl">Something went wrong</h1>
        <p className="max-w-md text-ink/70">
          An unexpected error interrupted the page. You can try again, or return home and pick up
          where you left off.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="admin" onClick={this.handleRetry}>
            Try again
          </Button>
          <Button variant="secondary" onClick={this.handleReload}>
            Back to home
          </Button>
        </div>
        {this.state.error ? (
          <details className="mt-2 max-w-md text-left text-xs text-ink/70">
            <summary className="cursor-pointer select-none">Technical detail</summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-line bg-surface-sunken p-3 text-[0.7rem]">
              {this.state.error.message}
            </pre>
          </details>
        ) : null}
      </div>
    );
  }
}
