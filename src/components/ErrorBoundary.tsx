import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-vitorra-bg flex flex-col items-center justify-center p-4 text-center">
          <div className="max-w-md w-full bg-vitorra-bg-alt border border-white/10 p-8 rounded-2xl shadow-2xl">
            <h1 className="text-2xl font-serif text-vitorra-gold mb-4">Something went wrong</h1>
            <p className="text-vitorra-muted mb-6">
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-vitorra-gold text-vitorra-bg font-medium rounded-full hover:bg-vitorra-gold-hover transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
