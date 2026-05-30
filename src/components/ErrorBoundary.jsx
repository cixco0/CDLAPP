import { Component } from 'react';

/**
 * Catches render-time crashes anywhere in the tree so a single bad component
 * shows a recoverable message instead of an unrecoverable white screen — which
 * for a driver mid-shift means a totally dead app with no way back.
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        // Surface in dev/console; a real deployment would forward to Sentry here.
        console.error('Render error caught by ErrorBoundary:', error, info);
    }

    handleReset = () => {
        this.setState({ error: null });
    };

    render() {
        if (this.state.error) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-center px-8 bg-black text-white gap-4">
                    <div className="text-4xl">⚠️</div>
                    <h1 className="text-ios-title3 font-semibold">Something went wrong</h1>
                    <p className="text-ios-footnote text-text-secondary">
                        The screen hit an unexpected error. Your saved data is safe.
                    </p>
                    <div className="flex gap-3 mt-2">
                        <button
                            onClick={this.handleReset}
                            className="px-5 py-2.5 rounded-ios bg-accent-blue text-white text-ios-body font-semibold min-h-touch press-effect"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => { window.location.href = '/'; }}
                            className="px-5 py-2.5 rounded-ios bg-ios-elevated text-white text-ios-body font-semibold min-h-touch press-effect"
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
