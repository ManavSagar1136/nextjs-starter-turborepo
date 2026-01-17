"use client";

import { useEffect } from "react";
import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";

import { toast } from "@buildbase/ui/hooks/use-toast";
import type { ToastActionElement } from "@buildbase/ui/components/ui/toast";

// Optional logger interface
interface Logger {
  info: (options: { tag?: string; msg: string; data?: unknown }) => void;
  error: (options: { tag?: string; msg: string; error?: unknown }) => void;
}

// Optional error utils interface
interface ErrorUtils {
  getErrorMessage: (error: unknown, fallback?: string) => string;
}

// Default log tags if logger is provided
const defaultLogTags = {
  API: "API",
} as const;

type LogTag = keyof typeof defaultLogTags;

// Toast type from @buildbase/ui
type ToasterToast = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
};

/**
 * Extended query options that support custom logging, toasts, and data change handlers.
 */
interface CustomQueryOptions<TQueryFnData, TError, TData, TQueryKey extends unknown[]> extends Omit<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  "queryFn"
> {
  queryFn: () => Promise<TQueryFnData>;
  log?: {
    success?: string;
    error?: string;
    tag?: LogTag;
  };
  toastProps?: {
    success?: Partial<ToasterToast>;
    error?: Partial<ToasterToast>;
  };
  toast?: boolean;
  onSuccess?: (data: TQueryFnData) => void;
  onError?: (error: TError) => void;
  onDataChanged?: (data: TQueryFnData) => void;
  // Optional dependencies
  logger?: Logger;
  errorUtils?: ErrorUtils;
}

declare global {
  /**
   * Convenient alias for partial custom query options.
   */
  type IUseTanstackQueryParams<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends unknown[] = unknown[],
  > = Partial<CustomQueryOptions<TQueryFnData, TError, TData, TQueryKey>>;
}

/**
 * Custom hook for TanStack Query that extends useQuery with enhanced features:
 *
 * - Automatic logging of success/error using your custom logger (optional).
 * - Optional toast notifications for both success and error, configurable via the `toast` option.
 * - Built-in after-success and after-error handlers.
 * - Optional `onDataChanged` callback that fires whenever data changes (not just on success).
 *
 * @template TQueryFnData The return/data type of the query function
 * @template TError The query error type
 * @template TData The shape/type of the data returned to consumers (default is TQueryFnData)
 * @template TQueryKey The type of the query key (default: unknown[])
 *
 * @param options The custom query options including the query function and handlers.
 *
 * @returns The standard UseQueryResult<TData, TError> from TanStack Query.
 *
 * @example <caption>Basic usage with logging and a toast</caption>
 * ```tsx
 * const result = useTanstackQuery({
 *   queryKey: ['user', userId],
 *   queryFn: async () => api.getUser(userId),
 *   log: { success: 'Fetched user', error: 'Failed to fetch user' },
 *   toast: true,
 * });
 * ```
 */
export function useTanstackQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends unknown[] = unknown[],
>(options: CustomQueryOptions<TQueryFnData, TError, TData, TQueryKey>): UseQueryResult<TData, TError> {
  const {
    queryFn,
    log = {},
    toastProps = {},
    toast: enableToast = false,
    onSuccess,
    onError,
    logger,
    errorUtils,
    ...rest
  } = options;

  const res = useQuery({
    ...rest,
    queryFn: async () => {
      try {
        // Actually run the user's async query function
        const data = await queryFn();

        if (log?.success && logger) {
          logger.info({
            tag: log?.tag || defaultLogTags.API,
            msg: log.success,
            data,
          });
        }

        if (enableToast) {
          const { action, ...restSuccessProps } = toastProps?.success || {};
          toast({
            ...restSuccessProps,
            title: (data as any)?.message || toastProps?.success?.title || log?.success || "Query succeeded",
            ...(action && { action: action as ToastActionElement }),
          });
        }

        onSuccess?.(data);

        return data;
      } catch (error: any) {
        if (log?.error && logger) {
          logger.error({
            tag: log?.tag || defaultLogTags.API,
            msg: log.error,
            error,
          });
        }

        if (enableToast) {
          const fallbackMessage =
            typeof toastProps?.error?.title === "string"
              ? toastProps.error.title
              : log?.error || "Something went wrong";
          const errorMessage = errorUtils
            ? errorUtils.getErrorMessage(error, fallbackMessage)
            : error?.message || fallbackMessage;

          const { action, ...restErrorProps } = toastProps?.error || {};
          toast({
            ...restErrorProps,
            variant: toastProps?.error?.variant || "destructive",
            title: errorMessage,
            ...(action && { action: action as ToastActionElement }),
          });
        }

        onError?.(error);
        throw error;
      }
    },
  });

  useEffect(() => {
    if (res.data !== undefined) {
      rest?.onDataChanged?.(res.data as TQueryFnData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res.data]);

  return res;
}
