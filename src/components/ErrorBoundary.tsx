import React from "react";

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Top-level error boundary. Catches runtime errors in any child tree,
 * shows a recovery UI instead of blanking the entire app.
 */
export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Log to console; swap for a real logger (Sentry, etc.) in production.
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="glass-strong rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <h1 className="font-display text-2xl font-bold text-destructive">Something went wrong</h1>
          <p className="text-sm text-muted-foreground break-words">{this.state.message}</p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.replace("/")}
              className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition"
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
