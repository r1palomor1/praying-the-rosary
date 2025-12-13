import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary specifically to catch crashes in the highlighting/rendering logic.
 * If highlighting logic fails, we want to degrade gracefully to showing plain text
 * rather than crashing the entire app.
 */
export class HighlightErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Highlighting/Render Error caught by boundary:', error, errorInfo);
        // We could log this to an analytics service here
    }

    render() {
        if (this.state.hasError) {
            // If a specific fallback is provided, use it
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Otherwise, render children but suppress the error? 
            // Actually, we can't safely re-render children if they caused the crash.
            // We should render a safe fallback message or try to recover.

            return (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 my-4 text-center">
                    <p className="font-semibold">Display Error</p>
                    <p className="text-sm mt-1">
                        There was a problem displaying the highlighted text.
                        Please try reloading or turning off highlighting.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-xs font-semibold transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
