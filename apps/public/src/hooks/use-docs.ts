import { TANSTACK_KEYS } from "@/constant/tanstack/tanstack-api-keys";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

import { API } from "@/services";
import type { IPageFilter } from "@buildbase/http-client/types";
import type { IDocFolder, IDocListResponse, IDocPost } from "@/services/docs";

/**
 * Convert legacy pagination params to IPageFilter format
 */
function toPageFilter(options?: {
  limit?: number;
  offset?: number;
  $page?: number;
  $limit?: number;
}): Partial<IPageFilter> {
  if (!options) return {};

  // Support both new format ($page, $limit) and legacy format (offset, limit)
  if (options.$page !== undefined || options.$limit !== undefined) {
    return {
      $page: options.$page,
      $limit: options.$limit,
    };
  }

  if (options.limit !== undefined || options.offset !== undefined) {
    const limit = options.limit || 20;
    const page =
      options.offset !== undefined ? Math.floor(options.offset / limit) + 1 : 1;
    return {
      $page: page,
      $limit: limit,
    };
  }

  return {};
}

/**
 * Hook to fetch published doc posts
 *
 * @param options - Filter and pagination options
 * @param queryOptions - Additional TanStack Query options
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDocPosts({
 *   folderId: "some-folder-id",
 *   $page: 1,
 *   $limit: 10,
 *   search: "api"
 * });
 * ```
 */
export const useDocPosts = (
  options?: {
    folderId?: string;
    search?: string;
    $page?: number;
    $limit?: number;
    limit?: number; // Legacy support
    offset?: number; // Legacy support
    orderBy?: "createdAt" | "updatedAt" | "publishedAt" | "title" | "order";
    order?: "asc" | "desc";
  },
  queryOptions?: Omit<
    UseQueryOptions<IDocListResponse, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  const pageFilter = toPageFilter(options);

  // Convert orderBy/order to sorting format if provided
  const sorting = options?.orderBy
    ? [
        {
          id: options.orderBy,
          desc: options.order === "desc",
        },
      ]
    : undefined;

  return useQuery<IDocListResponse>({
    queryKey: TANSTACK_KEYS.docs.posts(options),
    queryFn: async () => {
      const result = await API.docs.getAllPublished({
        ...pageFilter,
        ...options,
        sorting,
      });
      // Handle both IDocListResponse and PaginationResponse formats
      if (result && "docs" in result) {
        return {
          data: result.docs || [],
          total: result.totalDocs || 0,
          limit: result.limit || 20,
          offset: result.page ? (result.page - 1) * (result.limit || 20) : 0,
          hasMore: result.hasNextPage || false,
        };
      }
      return result;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    ...queryOptions,
  });
};

/**
 * Hook to fetch a single doc post by path
 *
 * @param path - Full path like "guides/api/integration" or just "integration"
 * @param enabled - Whether the query should run
 * @param queryOptions - Additional TanStack Query options
 *
 * @example
 * ```tsx
 * const { data: post, isLoading } = useDocPostByPath("guides/api/integration");
 * ```
 */
export const useDocPostByPath = (
  path: string,
  enabled: boolean = true,
  queryOptions?: Omit<
    UseQueryOptions<IDocPost | null, Error>,
    "queryKey" | "queryFn" | "enabled"
  >,
) => {
  return useQuery<IDocPost | null>({
    queryKey: TANSTACK_KEYS.docs.postByPath(path),
    queryFn: async () => {
      return await API.docs.getByPath(path);
    },
    enabled: enabled && !!path,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    ...queryOptions,
  });
};

/**
 * Hook to fetch public doc folders
 *
 * @param options - Folder query options (tree structure, search, pagination)
 * @param queryOptions - Additional TanStack Query options
 *
 * @example
 * ```tsx
 * // Get folder tree
 * const { data: folders } = useDocFolders({ tree: true });
 *
 * // Get paginated folders
 * const { data: folders } = useDocFolders({ $page: 1, $limit: 20, search: "guides" });
 * ```
 */
export const useDocFolders = (
  options?: {
    tree?: boolean;
    search?: string;
    parentFolderId?: string;
    $page?: number;
    $limit?: number;
    limit?: number; // Legacy support
    offset?: number; // Legacy support
  },
  queryOptions?: Omit<
    UseQueryOptions<IDocFolder[], Error>,
    "queryKey" | "queryFn"
  >,
) => {
  const pageFilter = toPageFilter(options);

  return useQuery<IDocFolder[]>({
    queryKey: TANSTACK_KEYS.docs.folders(options),
    queryFn: async () => {
      return await API.docs.getFolders({
        ...pageFilter,
        ...options,
      });
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - folders don't change frequently
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    ...queryOptions,
  });
};
