import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        logger.captureException(error, {
            component: "ErrorBoundary",
            componentStack: errorInfo.componentStack ?? undefined,
        });
    }

    public render() {
        if (this.state.hasError && this.state.error) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-6">
                    <div className="max-w-lg w-full space-y-4 rounded-lg border border-destructive/50 bg-destructive/5 p-6">
                        <div className="flex items-center gap-3 text-destructive">
                            <AlertTriangle className="h-8 w-8 shrink-0" />
                            <h1 className="text-xl font-semibold">Algo deu errado</h1>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            O aplicativo encontrou um erro. Recarregue a página ou tente fazer login novamente.
                        </p>
                        <details className="rounded bg-muted/50 p-3 text-xs font-mono overflow-auto max-h-48">
                            <summary className="cursor-pointer font-semibold text-foreground">Detalhes do erro</summary>
                            <pre className="mt-2 whitespace-pre-wrap break-words text-destructive">
                                {this.state.error.toString()}
                            </pre>
                            {this.state.errorInfo?.componentStack && (
                                <pre className="mt-2 whitespace-pre-wrap break-words text-muted-foreground">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            )}
                        </details>
                        <Button onClick={() => window.location.reload()} variant="destructive" className="w-full">
                            Recarregar a página
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
