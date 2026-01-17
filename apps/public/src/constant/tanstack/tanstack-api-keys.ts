type QueryId = string | null | undefined;

export const TANSTACK_KEYS = {
  blogs: {
    all: () => ["blogs"] as const,
    tags: (params?: { $page?: number; $limit?: number; limit?: number; offset?: number; search?: string }) =>
      [
        ...TANSTACK_KEYS.blogs.all(),
        "tags",
        "public",
        params?.$page,
        params?.$limit,
        params?.limit,
        params?.offset,
        params?.search,
      ] as const,
    posts: (params?: {
      featured?: boolean;
      folderId?: string;
      tagId?: string;
      authorId?: string;
      search?: string;
      $page?: number;
      $limit?: number;
      limit?: number;
      offset?: number;
      orderBy?: string;
      order?: string;
    }) =>
      [
        ...TANSTACK_KEYS.blogs.all(),
        "posts",
        "published",
        params?.featured,
        params?.folderId,
        params?.tagId,
        params?.authorId,
        params?.search,
        params?.$page,
        params?.$limit,
        params?.limit,
        params?.offset,
        params?.orderBy,
        params?.order,
      ] as const,
    post: (id: QueryId) =>
      [...TANSTACK_KEYS.blogs.all(), "post", ...(id ? [id] : [])] as const,
    postByPath: (path: string) =>
      [...TANSTACK_KEYS.blogs.all(), "post", "path", path] as const,
    postsByTag: (
      tagSlug: string,
      params?: { $page?: number; $limit?: number; limit?: number; offset?: number },
    ) =>
      [
        ...TANSTACK_KEYS.blogs.all(),
        "posts",
        "tag",
        tagSlug,
        params?.$page,
        params?.$limit,
        params?.limit,
        params?.offset,
      ] as const,
    postsByAuthor: (
      username: string,
      params?: { $page?: number; $limit?: number; limit?: number; offset?: number },
    ) =>
      [
        ...TANSTACK_KEYS.blogs.all(),
        "posts",
        "author",
        username,
        params?.$page,
        params?.$limit,
        params?.limit,
        params?.offset,
      ] as const,
    folders: (params?: { tree?: boolean; search?: string; parentFolderId?: string; $page?: number; $limit?: number }) =>
      [
        ...TANSTACK_KEYS.blogs.all(),
        "folders",
        "public",
        params?.tree,
        params?.search,
        params?.parentFolderId,
        params?.$page,
        params?.$limit,
      ] as const,
  },

  docs: {
    all: () => ["docs"] as const,
    posts: (params?: {
      folderId?: string;
      search?: string;
      $page?: number;
      $limit?: number;
      limit?: number;
      offset?: number;
      orderBy?: string;
      order?: string;
    }) =>
      [
        ...TANSTACK_KEYS.docs.all(),
        "posts",
        "published",
        params?.folderId,
        params?.search,
        params?.$page,
        params?.$limit,
        params?.limit,
        params?.offset,
        params?.orderBy,
        params?.order,
      ] as const,
    post: (id: QueryId) =>
      [...TANSTACK_KEYS.docs.all(), "post", ...(id ? [id] : [])] as const,
    postByPath: (path: string) =>
      [...TANSTACK_KEYS.docs.all(), "post", "path", path] as const,
    folders: (params?: { tree?: boolean; search?: string; parentFolderId?: string; $page?: number; $limit?: number }) =>
      [...TANSTACK_KEYS.docs.all(), "folders", "public", params?.tree, params?.search, params?.parentFolderId, params?.$page, params?.$limit] as const,
  },
};
