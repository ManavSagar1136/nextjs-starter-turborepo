import { useMutation, UseMutationOptions, UseMutationResult } from "@tanstack/react-query";

import { useCustomQueryClient } from "./use-custom-query-client";
import { toast } from "@buildbase/ui/hooks/use-toast";
import { ToastActionElement } from "@buildbase/ui/components/ui/toast";

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
  action?: ToastActionElement;
};

/**
 * Extended mutation options that add custom functionality to TanStack Query mutations
 */
interface CustomMutationOptions<TData = unknown, TError = unknown, TVariables = void> extends Omit<
  UseMutationOptions<TData, TError, TVariables>,
  "mutationFn"
> {
  mutationFn: (variables: TVariables) => Promise<TData>;
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
  invalidateQueries?: (string | unknown[])[];
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  // Optional dependencies
  logger?: Logger;
  errorUtils?: ErrorUtils;
}

declare global {
  /**
   * Global type alias for mutation parameters (partial version of CustomMutationOptions)
   */
  type IUseTanstackMutationParams<TData = unknown, TError = unknown, TVariables = void> = Partial<
    CustomMutationOptions<TData, TError, TVariables>
  >;
}

/**
 * Custom React hook that wraps TanStack Query's useMutation with enhanced features:
 * - Automatic logging of success/error operations (optional)
 * - Toast notifications for user feedback
 * - Automatic query invalidation after successful mutations
 * - Custom success/error callbacks
 *
 * @template TData - The type of data returned by the mutation
 * @template TError - The type of error that may be thrown
 * @template TVariables - The type of variables passed to the mutation function
 *
 * @param {CustomMutationOptions<TData, TError, TVariables>} options - Configuration options for the mutation
 * @returns {UseMutationResult<TData, TError, TVariables>} Standard TanStack Query mutation result object
 */
export function useTanstackMutation<TData = unknown, TError = unknown, TVariables = void>(
  options: CustomMutationOptions<TData, TError, TVariables>
): UseMutationResult<TData, TError, TVariables> {
  // Destructure options with default values
  const {
    mutationFn,
    log = {},
    toastProps = {},
    toast: enableToast = true,
    invalidateQueries,
    onSuccess,
    onError,
    logger,
    errorUtils,
    ...rest
  } = options;

  // Get the custom query client hook to access query invalidation utilities
  const { invalidateEachQuery } = useCustomQueryClient();

  return useMutation({
    ...rest,
    mutationFn: async (variables: TVariables) => {
      try {
        // Execute the actual mutation function with provided variables
        const data = await mutationFn(variables);

        // Log success message if logging is configured
        if (log?.success && logger) {
          logger.info({
            tag: log?.tag || defaultLogTags.API,
            msg: log.success,
            data,
          });
        }

        // Show success toast notification if enabled
        if (enableToast) {
          const { action, ...restSuccessProps } = toastProps?.success || {};
          toast({
            ...restSuccessProps,
            title: (data as any)?.message || toastProps?.success?.title || log?.success || "Mutation succeeded",
            ...(action && { action: action as ToastActionElement }),
          });
        }

        // Invalidate all specified queries in parallel
        if (invalidateQueries?.length) {
          invalidateEachQuery(invalidateQueries);
        }

        onSuccess?.(data, variables);

        return data;
      } catch (error: any) {
        if (log?.error && logger) {
          logger.error({
            tag: log?.tag || defaultLogTags.API,
            msg: log.error,
            error,
          });
        }

        // Show error toast notification if enabled
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

        onError?.(error, variables);
        throw error;
      }
    },
  });
}
