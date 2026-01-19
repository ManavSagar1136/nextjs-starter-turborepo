import { TANSTACK_KEYS } from "@/constant/tanstack/tanstack-api-keys";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

import { API } from "@/services";
import type { IPageFilter } from "@buildbase/http-client/types";
import type {
  IBlogFolder,
  IBlogListResponse,
  IBlogPost,
  IBlogPostByAuthorResponse,
  IBlogPostByTagResponse,
  IBlogTag,
} from "@/services/blogs";

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
 * Hook to fetch public blog tags
 *
 * @param options - Pagination and filter options
 * @param queryOptions - Additional TanStack Query options
 *
 * @example
 * ```tsx
 * const { data: tags, isLoading } = useBlogTags({ $page: 1, $limit: 20, search: "react" });
 * ```
 */
export const useBlogTags = (
  options?: {
    $page?: number;
    $limit?: number;
    limit?: number; // Legacy support
    offset?: number; // Legacy support
    search?: string;
  },
  queryOptions?: Omit<
    UseQueryOptions<IBlogTag[], Error>,
    "queryKey" | "queryFn"
  >,
) => {
  const pageFilter = toPageFilter(options);

  return useQuery<IBlogTag[]>({
    queryKey: TANSTACK_KEYS.blogs.tags(options),
    queryFn: async () => {
      return await API.blogs.getTags({
        ...pageFilter,
        ...options,
      });
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - tags don't change frequently
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    ...queryOptions,
  });
};

/**
 * Hook to fetch published blog posts
 *
 * @param options - Filter and pagination options
 * @param queryOptions - Additional TanStack Query options
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useBlogPosts({
 *   featured: true,
 *   $page: 1,
 *   $limit: 10,
 *   search: "react"
 * });
 * ```
 */
export const useBlogPosts = (
  options?: {
    featured?: boolean;
    folderId?: string;
    tagId?: string;
    authorId?: string;
    search?: string;
    $page?: number;
    $limit?: number;
    limit?: number; // Legacy support
    offset?: number; // Legacy support
    orderBy?: "createdAt" | "updatedAt" | "publishedAt" | "title";
    order?: "asc" | "desc";
  },
  queryOptions?: Omit<
    UseQueryOptions<IBlogListResponse, Error>,
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

  return useQuery<IBlogListResponse>({
    queryKey: TANSTACK_KEYS.blogs.posts(options),
    queryFn: async () => {
      return await API.blogs.getAllPublished({
        ...pageFilter,
        ...options,
        sorting,
      });
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    ...queryOptions,
  });
};

/**
 * Hook to fetch a single blog post by path
 *
 * @param path - Full path like "tech/react/hooks" or just "hooks"
 * @param enabled - Whether the query should run
 * @param queryOptions - Additional TanStack Query options
 *
 * @example
 * ```tsx
 * const { data: post, isLoading } = useBlogPostByPath("tech/react/hooks");
 * ```
 */
export const useBlogPostByPath = (
  path: string,
  enabled: boolean = true,
  queryOptions?: Omit<
    UseQueryOptions<IBlogPost, Error>,
    "queryKey" | "queryFn" | "enabled"
  >,
) => {
  return useQuery<IBlogPost>({
    queryKey: TANSTACK_KEYS.blogs.postByPath(path),
    queryFn: async () => {
      return await API.blogs.getByPath(path);
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
 * Hook to fetch blog posts by tag slug
 *
 * @param tagSlug - The tag slug to filter by
 * @param options - Pagination options
 * @param enabled - Whether the query should run
 * @param queryOptions - Additional TanStack Query options
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useBlogPostsByTag("react", { $page: 1, $limit: 10 });
 * ```
 */
export const useBlogPostsByTag = (
  tagSlug: string,
  options?: {
    $page?: number;
    $limit?: number;
    limit?: number; // Legacy support
    offset?: number; // Legacy support
  },
  enabled: boolean = true,
  queryOptions?: Omit<
    UseQueryOptions<IBlogPostByTagResponse, Error>,
    "queryKey" | "queryFn" | "enabled"
  >,
) => {
  const pageFilter = toPageFilter(options);

  return useQuery<IBlogPostByTagResponse>({
    queryKey: TANSTACK_KEYS.blogs.postsByTag(tagSlug, options),
    queryFn: async () => {
      return await API.blogs.getByTag(tagSlug, pageFilter);
    },
    enabled: enabled && !!tagSlug,
    staleTime: 1000 * 60 * 3, // 3 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    ...queryOptions,
  });
};

/**
 * Hook to fetch blog posts by author username
 *
 * @param username - The author username to filter by
 * @param options - Pagination options
 * @param enabled - Whether the query should run
 * @param queryOptions - Additional TanStack Query options
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useBlogPostsByAuthor("john-doe", { $page: 1, $limit: 10 });
 * ```
 */
export const useBlogPostsByAuthor = (
  username: string,
  options?: {
    $page?: number;
    $limit?: number;
    limit?: number; // Legacy support
    offset?: number; // Legacy support
  },
  enabled: boolean = true,
  queryOptions?: Omit<
    UseQueryOptions<IBlogPostByAuthorResponse, Error>,
    "queryKey" | "queryFn" | "enabled"
  >,
) => {
  const pageFilter = toPageFilter(options);

  return useQuery<IBlogPostByAuthorResponse>({
    queryKey: TANSTACK_KEYS.blogs.postsByAuthor(username, options),
    queryFn: async () => {
      return await API.blogs.getByAuthor(username, pageFilter);
    },
    enabled: enabled && !!username,
    staleTime: 1000 * 60 * 3, // 3 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    ...queryOptions,
  });
};

/**
 * Hook to fetch public blog folders (categories)
 *
 * @param options - Folder query options (tree structure, search, pagination)
 * @param queryOptions - Additional TanStack Query options
 *
 * @example
 * ```tsx
 * // Get folder tree
 * const { data: folders } = useBlogFolders({ tree: true });
 *
 * // Get paginated folders
 * const { data: folders } = useBlogFolders({ $page: 1, $limit: 20, search: "tech" });
 * ```
 */
export const useBlogFolders = (
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
    UseQueryOptions<IBlogFolder[], Error>,
    "queryKey" | "queryFn"
  >,
) => {
  const pageFilter = toPageFilter(options);

  return useQuery<IBlogFolder[]>({
    queryKey: TANSTACK_KEYS.blogs.folders(options),
    queryFn: async () => {
      return await API.blogs.getFolders({
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
