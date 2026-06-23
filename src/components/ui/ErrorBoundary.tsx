import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              padding: 40,
              background: "var(--bg)",
              color: "var(--text)",
            }}
          >
            <span style={{ fontSize: 32, opacity: 0.4 }}>⚠</span>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--text-secondary)" }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", maxWidth: 400 }}>
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={this.handleReset}
              style={{
                padding: "8px 20px", fontSize: 13, fontWeight: 500,
                background: "var(--accent-alpha)", border: "1px solid var(--accent)",
                color: "var(--accent)", cursor: "pointer", borderRadius: 10,
              }}
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
