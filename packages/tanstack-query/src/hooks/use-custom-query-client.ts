import { useCallback } from "react";
import { InvalidateQueryFilters, useQueryClient } from "@tanstack/react-query";

/**
 * Custom hook that extends the TanStack Query Client with additional utility methods
 *
 * @returns An extended QueryClient with additional methods for query invalidation
 *
 * @example
 * ```tsx
 * const { invalidateEachQuery } = useCustomQueryClient();
 *
 * // Invalidate multiple query keys at once
 * invalidateEachQuery(['users', ['posts', { userId: 1 }]]);
 * ```
 */
export function useCustomQueryClient() {
  const queryClient = useQueryClient();

  /**
   * Invalidates multiple queries in parallel
   *
   * @param queryKeys - An array of query keys to invalidate. Each key can be a string or an array.
   * @returns A promise that resolves when all invalidations are complete
   */
  const invalidateEachQuery = useCallback(
    async (queryKeys: (string | unknown[])[], filters?: Omit<InvalidateQueryFilters, "queryKey">) => {
      if (!queryKeys?.length) return;

      await Promise.all(
        queryKeys.map(key =>
          queryClient.invalidateQueries({
            ...filters,
            queryKey: Array.isArray(key) ? key : [key],
            exact: filters?.exact ?? false,
            type: filters?.type ?? "all",
          })
        )
      );
    },
    [queryClient]
  );

  // Create a new object with all queryClient properties plus our custom method
  return { queryClient, invalidateEachQuery };
}
