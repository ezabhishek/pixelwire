import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryState {
  error: Error | null;
}

/** Last-resort fallback so a rendering bug shows a way out instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Pixel Wires crashed while rendering', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas p-6">
        <div className="max-w-md rounded-card border border-line bg-surface p-8 text-center shadow-card">
          <h1 className="text-lg font-semibold text-ink">Something broke</h1>
          <p className="mt-2 text-sm text-ink-muted">
            The page hit an unexpected error. Reloading usually fixes it; your bookmarks and filters are kept.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-ink-inverse transition-colors hover:bg-accent-hover"
          >
            Reload Pixel Wires
          </button>
        </div>
      </div>
    );
  }
}
