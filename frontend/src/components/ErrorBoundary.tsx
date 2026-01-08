import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center bg-background-surface border border-semantic-error/30 rounded-panel p-8">
          <div className="text-center max-w-lg">
            <AlertCircle className="w-16 h-16 text-semantic-error mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2 font-display">
              Ein Fehler ist aufgetreten
            </h2>
            <p className="text-text-secondary mb-4">
              {this.props.fallbackMessage || 'Es gab ein Problem beim Laden dieser Komponente.'}
            </p>
            {this.state.error && (
              <details className="text-left bg-background-elevated border border-border rounded-card p-4 mb-4">
                <summary className="text-text-muted text-sm cursor-pointer hover:text-text-secondary">
                  Technische Details anzeigen
                </summary>
                <pre className="text-xs text-text-muted mt-2 overflow-auto max-h-40 font-mono">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-button font-medium transition-colors duration-150"
            >
              <RefreshCw className="w-4 h-4" />
              Erneut versuchen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
