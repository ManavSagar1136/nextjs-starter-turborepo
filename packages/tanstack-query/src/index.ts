/**
 * Re-export commonly used TanStack Query hooks, types, and utilities
 * This allows apps to import from @buildbase/tanstack-query instead of @tanstack/react-query directly
 */

// Core hooks
export {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  useSuspenseQuery,
  useSuspenseInfiniteQuery,
  useQueries,
  useIsFetching,
  useIsMutating,
  useIsRestoring,
} from "@tanstack/react-query";

// Provider components
export { QueryClientProvider } from "@tanstack/react-query";
export { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Core classes and functions
export {
  QueryClient,
  QueryCache,
  MutationCache,
  focusManager,
  onlineManager,
  infiniteQueryOptions,
  queryOptions,
  mutationOptions,
} from "@tanstack/react-query";

// Types
export type {
  // Query types
  UseQueryResult,
  UseQueryOptions,
  UseInfiniteQueryResult,
  UseInfiniteQueryOptions,
  UseSuspenseQueryOptions,
  UseSuspenseInfiniteQueryOptions,
  QueryObserverResult,
  InfiniteQueryObserverResult,

  // Mutation types
  UseMutationResult,
  UseMutationOptions,
  MutationObserverResult,

  // QueryClient types
  QueryClientConfig,

  // Query state types
  Query,
  QueryState,
  QueryStatus,
  FetchStatus,

  // Mutation state types
  Mutation,
  MutationState,
  MutationStatus,

  // Error types
  QueryErrorResetBoundary,
  QueryErrorResetBoundaryProps,

  // Other types
  QueryKey,
  QueryFunction,
  QueryFunctionContext,
  MutationFunction,
  MutationKey,
  QueryMeta,
  MutationMeta,
  QueryFilters,
  MutationFilters,
  Updater,
  SetDataOptions,
  RefetchOptions,
  InvalidateQueryFilters,
  RefetchQueryFilters,
  FetchQueryOptions,
  EnsureQueryDataOptions,
  InfiniteData,
  DefaultedQueryObserverOptions,
  QueryObserverOptions,
  InfiniteQueryObserverOptions,
  MutationObserverOptions,
  InfiniteQueryPageParamsOptions,
} from "@tanstack/react-query";

// Re-export our own exports
export * from "./provider";
export * from "./utils/query-helpers";

// Custom hooks
export * from "./hooks/use-custom-query-client";
export * from "./hooks/use-tanstack-query";
export * from "./hooks/use-tanstack-mutation";
