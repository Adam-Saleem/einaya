import { AlertTriangle } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from '@/Components/ui/button';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        if (typeof console !== 'undefined') {
            console.error('Unhandled error in React tree:', error, info.componentStack);
        }
        if (typeof fetch === 'function') {
            try {
                const csrf = document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content');
                fetch('/api/client-errors', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
                    },
                    body: JSON.stringify({
                        message: error.message,
                        stack: error.stack ?? null,
                        component_stack: info.componentStack ?? null,
                        url: window.location.href,
                        user_agent: navigator.userAgent,
                    }),
                    credentials: 'same-origin',
                }).catch(() => {});
            } catch {
                // best-effort reporter, never throws
            }
        }
    }

    private reload = () => {
        window.location.reload();
    };

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                    <AlertTriangle className="h-7 w-7" />
                </span>
                <div className="space-y-1">
                    <p className="text-h3 text-foreground">Something went wrong.</p>
                    <p className="text-sm text-muted-foreground">
                        The error has been reported. Reloading the page usually fixes it.
                    </p>
                </div>
                <Button onClick={this.reload}>Reload page</Button>
            </div>
        );
    }
}
