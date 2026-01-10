"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isDevelopment } from "@buildbase/env";

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  className?: string;
  showDetails?: boolean;
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  resetError: () => void;
  showDetails?: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Log error to console in development
    if (isDevelopment()) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

export function DefaultErrorFallback({ error, errorInfo, resetError, showDetails = false }: ErrorFallbackProps) {
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);

  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Something went wrong</CardTitle>
          <CardDescription>
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Message */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error.message || "An unexpected error occurred"}</AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={handleReload} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Page
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          {/* Error Details */}
          {showDetails && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                className="w-full"
              >
                <Bug className="mr-2 h-4 w-4" />
                {showErrorDetails ? "Hide" : "Show"} Error Details
              </Button>

              {showErrorDetails && (
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-medium">Error Stack:</h4>
                    <pre className="bg-muted max-h-40 overflow-auto rounded-md p-3 text-sm">{error.stack}</pre>
                  </div>

                  {errorInfo && (
                    <div>
                      <h4 className="mb-2 font-medium">Component Stack:</h4>
                      <pre className="bg-muted max-h-40 overflow-auto rounded-md p-3 text-sm">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function SimpleErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
      <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">{error.message || "An unexpected error occurred"}</p>
      <Button onClick={resetError}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

export function InlineErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Alert className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error.message || "An error occurred"}</span>
        <Button variant="ghost" size="sm" onClick={resetError}>
          <RefreshCw className="mr-1 h-3 w-3" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// Hook for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}
