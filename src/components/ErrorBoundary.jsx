import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="max-w-md w-full border border-[#dc2626] rounded-lg p-6 bg-red-50">
            <h2 className="text-xl font-semibold text-[#dc2626] mb-2">
              Une erreur inattendue s&apos;est produite
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              {this.state.error?.message ?? 'Erreur inconnue'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
