'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — catches render errors in the component tree and displays
 * a user-friendly fallback instead of a blank white screen.
 *
 * Usage:
 *   <ErrorBoundary fallback={<MyFallback />}>
 *     <RiskyComponent />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo.componentStack);
    // Could send to an error reporting service here
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E50914]/10 border border-[#E50914]/20">
              <AlertTriangle className="h-8 w-8 text-[#E50914]" />
            </div>
            <h2 className="text-lg font-black text-white mb-2">Algo deu errado</h2>
            <p className="text-sm text-gray-400 mb-6">
              Ocorreu um erro inesperado ao renderizar esta seção.
              Tente recarregar a página.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1E1E2A] border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-[#2A2A3A] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
