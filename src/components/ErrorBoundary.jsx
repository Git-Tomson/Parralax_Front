import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Ignore les erreurs DOM "removeChild" qui viennent des extensions de navigateur
    if (
      error?.message?.includes('removeChild') ||
      error?.message?.includes('insertBefore') ||
      error?.message?.includes('not a child')
    ) {
      // Reset silencieux pour ce type d'erreur DOM externe
      this.setState({ hasError: false, error: null, errorInfo: null });
      return;
    }
    console.error('[PARALLAX ErrorBoundary]', error, info);
    this.setState({ errorInfo: info });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 shadow-xl overflow-hidden">
            <div className="bg-red-50 border-b border-red-100 p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Une erreur inattendue s&apos;est produite
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  L&apos;interface PARALLAX a rencontré un problème. Vous pouvez réessayer ou recharger la page.
                </p>
              </div>
            </div>
            <div className="p-6">
              {this.state.error?.message && (
                <div className="bg-slate-900 rounded-lg p-3 mb-4 font-mono text-xs text-red-400 overflow-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw size={14} />
                  Réessayer
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Recharger la page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
