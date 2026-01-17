import { IPageFilter, PaginationResponse } from "@buildbase/http-client/types";

import { BaseApiPaginationController } from "../base";

export interface IBlogPost {
  id: string;
  title: string;
  slug: string;
  url?: string;
  description: string;
  excerpt?: string | null;
  content: string;
  image?: string | null;
  imageTitle?: string | null;
  assetFileId?: string | null;
  featured: boolean;
  featuredAt?: Date | null;
  folderId?: string | null;
  published: boolean;
  publishedAt?: Date | null;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  folder?: IBlogFolder;
  authors?: Array<IBlogAuthor>;
  tags?: Array<IBlogTag>;
  suggestedPosts?: Array<IBlogPost>;
  creator?: IBlogAuthor;
  updatedBy?: IBlogAuthor;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBlogFolder {
  id: string;
  name: string;
  slug: string;
  path: string | null;
  parentFolderId?: string | null;
  parentFolder?: IBlogFolder | null;
  subFolders?: IBlogFolder[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IBlogTag {
  id: string;
  title: string;
  slug: string;
  url?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBlogAuthor {
  id: string;
  name: string;
  username: string;
  image?: string | null;
  links?: Record<string, string> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBlogListResponse {
  data: IBlogPost[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Alias for PaginationResponse to maintain backward compatibility
export type IBlogPaginationResponse = PaginationResponse<IBlogPost>;

export interface IBlogPostByTagResponse extends IBlogListResponse {
  tag: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface IBlogPostByAuthorResponse extends IBlogListResponse {
  author: {
    id: string;
    name: string;
    username: string;
    image?: string | null;
    links?: Record<string, string> | null;
  };
}

export class BlogApis extends BaseApiPaginationController<IBlogPost> {
  protected urlPath: string = "/blogs";

  /**
   * Get all published blog posts (public)
   * Uses IPageFilter for consistent pagination, filtering, and sorting
   */
  async getAllPublished(
    filter: Partial<IPageFilter> & {
      featured?: boolean;
      folderId?: string;
      tagId?: string;
      authorId?: string;
      search?: string;
    } = {},
  ): Promise<PaginationResponse<IBlogPost> & IBlogListResponse> {
    const query: any = {};

    // Standard IPageFilter params
    if (filter.$page) query.$page = filter.$page;
    if (filter.$limit) query.$limit = filter.$limit;
    if (filter.populate) query.populate = filter.populate;
    if (filter.sorting) {
      const sort: { [key: string]: -1 | 1 | 0 } = {};
      filter.sorting.forEach((_sort: { id: string; desc: boolean }) => {
        sort[_sort.id] = _sort.desc ? -1 : 1;
      });
      query.sort = sort;
    }
    if (filter.filter) query.filter = filter.filter;

    // Blog-specific filters
    if (filter.featured !== undefined) {
      query.featured = String(filter.featured);
    }
    if (filter.folderId) query.folderId = filter.folderId;
    if (filter.tagId) query.tagId = filter.tagId;
    if (filter.authorId) query.authorId = filter.authorId;
    if (filter.search) query.search = filter.search;

    const response = await this.get(this.urlPath, query, {});
    return response.data.data || response.data;
  }

  /**
   * Get blog post by path (public)
   * @param path - Full path like "tech/react/hooks" or just "hooks"
   */
  async getByPath(path: string): Promise<IBlogPost | null> {
    try {
      const result = await this.get(
        `${this.urlPath}/path?path=${encodeURIComponent(path)}`,
        {},
        {},
      );
      return result.data;
    } catch (error: any) {
      // Handle 404 as null (not found) instead of throwing
      if (error?.status === 404 || error?.response?.status === 404 || error?.statusCode === 404) {
        return null;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get public tags (public, no auth required)
   * Uses IPageFilter for consistent pagination, filtering, and sorting
   */
  async getTags(
    filter: Partial<IPageFilter> & {
      search?: string;
    } = {},
  ): Promise<IBlogTag[]> {
    const query: any = {};

    // Standard IPageFilter params
    if (filter.$page) query.$page = filter.$page;
    if (filter.$limit) query.$limit = filter.$limit;
    if (filter.populate) query.populate = filter.populate;
    if (filter.sorting) {
      const sort: { [key: string]: -1 | 1 | 0 } = {};
      filter.sorting.forEach((_sort: { id: string; desc: boolean }) => {
        sort[_sort.id] = _sort.desc ? -1 : 1;
      });
      query.sort = sort;
    }
    if (filter.filter) query.filter = filter.filter;

    // Tag-specific filters
    if (filter.search) query.search = filter.search;

    const response = await this.get(`${this.urlPath}/tags/public`, query, {});
    const data = response.data;
    // API route returns array directly, but HTTP client might wrap it
    if (Array.isArray(data)) {
      return data;
    }
    // If wrapped, try to extract the array
    if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }
    // Support both new format (tags) and backward compatibility (docs)
    if (data?.tags && Array.isArray(data.tags)) {
      return data.tags;
    }
    if (data?.docs && Array.isArray(data.docs)) {
      return data.docs;
    }
    // Fallback to empty array
    return [];
  }

  /**
   * Get public folders (categories) (public, no auth required)
   * Uses IPageFilter for consistent pagination, filtering, and sorting
   */
  async getFolders(
    filter: Partial<IPageFilter> & {
      tree?: boolean;
      search?: string;
      parentFolderId?: string;
    } = {},
  ): Promise<IBlogFolder[]> {
    const query: any = {};

    // Special case: tree structure
    if (filter.tree) {
      query.tree = "true";
      if (filter.parentFolderId) {
        query.parentFolderId = filter.parentFolderId;
      }
      const response = await this.get(
        `${this.urlPath}/folders/public`,
        query,
        {},
      );
      // API route returns array directly, but HTTP client might wrap it
      const data = response.data;
      return Array.isArray(data) ? data : (data?.data || data || []);
    }

    // Standard IPageFilter params
    if (filter.$page) query.$page = filter.$page;
    if (filter.$limit) query.$limit = filter.$limit;
    if (filter.populate) query.populate = filter.populate;
    if (filter.sorting) {
      const sort: { [key: string]: -1 | 1 | 0 } = {};
      filter.sorting.forEach((_sort: { id: string; desc: boolean }) => {
        sort[_sort.id] = _sort.desc ? -1 : 1;
      });
      query.sort = sort;
    }
    if (filter.filter) query.filter = filter.filter;

    // Folder-specific filters
    if (filter.search) query.search = filter.search;
    if (filter.parentFolderId) query.parentFolderId = filter.parentFolderId;

    const response = await this.get(
      `${this.urlPath}/folders/public`,
      query,
      {},
    );
    const data = response.data.data || response.data;
    // Support both new format (docs) and backward compatibility (folders)
    return data.folders || data.docs || [];
  }

  /**
   * Get published posts by tag slug (public)
   * Uses IPageFilter for consistent pagination, filtering, and sorting
   */
  async getByTag(
    tagSlug: string,
    filter: Partial<IPageFilter> = {},
  ): Promise<IBlogPostByTagResponse> {
    const query: any = {};

    // Standard IPageFilter params
    if (filter.$page) query.$page = filter.$page;
    if (filter.$limit) query.$limit = filter.$limit;
    if (filter.populate) query.populate = filter.populate;
    if (filter.sorting) {
      const sort: { [key: string]: -1 | 1 | 0 } = {};
      filter.sorting.forEach((_sort: { id: string; desc: boolean }) => {
        sort[_sort.id] = _sort.desc ? -1 : 1;
      });
      query.sort = sort;
    }
    if (filter.filter) query.filter = filter.filter;

    const response = await this.get(
      `${this.urlPath}/tags/by-slug/${tagSlug}`,
      query,
      {},
    );
    return response.data.data || response.data;
  }

  /**
   * Get published posts by author username (public)
   * Uses IPageFilter for consistent pagination, filtering, and sorting
   */
  async getByAuthor(
    username: string,
    filter: Partial<IPageFilter> = {},
  ): Promise<IBlogPostByAuthorResponse> {
    const query: any = {};

    // Standard IPageFilter params
    if (filter.$page) query.$page = filter.$page;
    if (filter.$limit) query.$limit = filter.$limit;
    if (filter.populate) query.populate = filter.populate;
    if (filter.sorting) {
      const sort: { [key: string]: -1 | 1 | 0 } = {};
      filter.sorting.forEach((_sort: { id: string; desc: boolean }) => {
        sort[_sort.id] = _sort.desc ? -1 : 1;
      });
      query.sort = sort;
    }
    if (filter.filter) query.filter = filter.filter;

    const response = await this.get(
      `${this.urlPath}/authors/by-username/${username}/posts`,
      query,
      {},
    );
    return response.data.data || response.data;
  }
}
