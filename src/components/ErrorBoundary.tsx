import React from "react";

interface State { hasError: boolean; message: string; }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background mesh-bg flex items-center justify-center p-6">
        <div className="glass-strong rounded-2xl p-10 max-w-md w-full text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
            <p className="text-xs text-muted-foreground font-mono break-words">{this.state.message}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => this.setState({ hasError: false, message: "" })}
              className="px-5 py-2 rounded-xl bg-gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >Try again</button>
            <button
              onClick={() => window.location.replace("/")}
              className="px-5 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors"
            >Go home</button>
          </div>
        </div>
      </div>
    );
  }
}
