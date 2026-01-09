import type { QueryClient } from "@tanstack/react-query";

/**
 * Prefetch a query
 */
export const prefetchQuery = async <T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
};

/**
 * Invalidate and refetch queries
 */
export const invalidateQueries = (
  queryClient: QueryClient,
  queryKey: readonly unknown[],
) => {
  return queryClient.invalidateQueries({ queryKey });
};

/**
 * Reset queries to their initial state
 */
export const resetQueries = (
  queryClient: QueryClient,
  queryKey: readonly unknown[],
) => {
  return queryClient.resetQueries({ queryKey });
};
