import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Top-level error boundary — keeps a thrown render error from blanking the
 * whole SPA and offers a branded recovery path.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Unhandled UI error:', error, info.componentStack);
    }
  }

  private handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-cream px-6 text-center">
        <p className="font-heading text-xs uppercase tracking-[0.32em] text-gold">
          Kadamba&apos;s Designer Studio
        </p>
        <h1 className="font-heading text-3xl text-black sm:text-4xl">Something went wrong</h1>
        <p className="max-w-md text-black/70">
          An unexpected error interrupted the page. Please return home and try again.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          className="rounded-md bg-black px-6 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Back to home
        </button>
      </div>
    );
  }
}
