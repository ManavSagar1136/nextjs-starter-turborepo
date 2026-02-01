"use client";

import { useState, useCallback, useRef } from "react";

// ============================================================================
// Types
// ============================================================================

export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
  onError?: (error: Error) => void;
}

export interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
}

const DEFAULT_CONFIG: Required<Omit<RetryConfig, "onRetry" | "onError">> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  exponentialBackoff: true,
};

// ============================================================================
// Error Recovery Hook
// ============================================================================

/**
 * Hook for retrying failed operations with exponential backoff
 */
export function useErrorRecovery<T extends (...args: any[]) => Promise<any>>(
  operation: T,
  config: RetryConfig = {}
): {
  execute: T;
  retryState: RetryState;
  reset: () => void;
} {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setRetryState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
    });
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
        try {
          // Reset retry state on first attempt
          if (attempt === 0) {
            setRetryState({
              isRetrying: false,
              retryCount: 0,
              lastError: null,
            });
          } else {
            // Set retry state during retries
            setRetryState({
              isRetrying: true,
              retryCount: attempt,
              lastError: lastError || null,
            });

            // Calculate delay with exponential backoff
            const delay = finalConfig.exponentialBackoff
              ? finalConfig.retryDelay * Math.pow(2, attempt - 1)
              : finalConfig.retryDelay;

            // Call onRetry callback
            if (lastError && finalConfig.onRetry) {
              finalConfig.onRetry(attempt, lastError);
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          // Execute the operation
          const result = await operation(...args);

          // Success - reset state
          setRetryState({
            isRetrying: false,
            retryCount: 0,
            lastError: null,
          });

          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Don't retry on the last attempt
          if (attempt === finalConfig.maxRetries) {
            setRetryState({
              isRetrying: false,
              retryCount: attempt,
              lastError,
            });

            // Call onError callback
            if (finalConfig.onError) {
              finalConfig.onError(lastError);
            }

            throw lastError;
          }

          // Check if error is retriable (network errors, timeouts, etc.)
          const isRetriable = isRetriableError(lastError);

          if (!isRetriable) {
            // Not retriable - throw immediately
            setRetryState({
              isRetrying: false,
              retryCount: attempt,
              lastError,
            });

            if (finalConfig.onError) {
              finalConfig.onError(lastError);
            }

            throw lastError;
          }
        }
      }

      // Should never reach here, but TypeScript needs it
      throw lastError || new Error("Operation failed");
    },
    [operation, finalConfig]
  ) as T;

  return {
    execute,
    retryState,
    reset,
  };
}

/**
 * Check if an error is retriable
 */
function isRetriableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Network errors
  if (
    name.includes("network") ||
    name.includes("timeout") ||
    name.includes("abort") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("fetch failed") ||
    message.includes("connection")
  ) {
    return true;
  }

  // HTTP 5xx errors (server errors)
  if (message.includes("500") || message.includes("502") || message.includes("503") || message.includes("504")) {
    return true;
  }

  // Rate limiting (429) - retry with backoff
  if (message.includes("429") || message.includes("rate limit")) {
    return true;
  }

  // Not retriable
  return false;
}
