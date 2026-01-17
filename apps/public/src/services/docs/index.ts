import { IPageFilter, PaginationResponse } from "@buildbase/http-client/types";

import { BaseApiPaginationController } from "../base";

export interface IDocPost {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  description?: string | null;
  content: string;
  order?: number | null;
  folderId?: string | null;
  published: boolean;
  publishedAt?: Date | null;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  folder?: IDocFolder | null;
  updatedBy?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  url?: string;
}

export interface IDocFolder {
  id: string;
  name: string;
  slug: string;
  path: string | null;
  parentFolderId?: string | null;
  parentFolder?: IDocFolder | null;
  subFolders?: IDocFolder[];
  createdAt: Date;
  updatedAt: Date;
  url?: string;
}

export interface IDocListResponse {
  data: IDocPost[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Alias for PaginationResponse to maintain backward compatibility
export type IDocPaginationResponse = PaginationResponse<IDocPost>;

export class DocApis extends BaseApiPaginationController<IDocPost> {
  protected urlPath: string = "/docs";

  // ========== Public APIs (no auth required) ==========

  /**
   * Get all published documents (public)
   * Uses IPageFilter for consistent pagination, filtering, and sorting
   */
  async getAllPublished(
    filter: Partial<IPageFilter> & {
      folderId?: string;
      search?: string;
    } = {}
  ): Promise<PaginationResponse<IDocPost> & IDocListResponse> {
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

    // Document-specific filters
    if (filter.folderId) query.folderId = filter.folderId;
    if (filter.search) query.search = filter.search;

    const response = await this.get(this.urlPath, query, {});
    return response.data.data || response.data;
  }

  /**
   * Get document by path (public)
   * @param path - Full path like "guides/api/integration" or just "integration"
   */
  async getByPath(path: string): Promise<IDocPost | null> {
    try {
      const result = await this.get(`${this.urlPath}/path?path=${encodeURIComponent(path)}`, {}, {});
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
   * Get public folders (public, no auth required)
   * Uses IPageFilter for consistent pagination, filtering, and sorting
   */
  async getFolders(
    filter: Partial<IPageFilter> & {
      tree?: boolean;
      search?: string;
      parentFolderId?: string;
    } = {}
  ): Promise<IDocFolder[]> {
    const query: any = {};

    // Special case: tree structure
    if (filter.tree) {
      query.tree = "true";
      if (filter.parentFolderId) {
        query.parentFolderId = filter.parentFolderId;
      }
      const response = await this.get(`${this.urlPath}/folders/public`, query, {});
      // API route returns array directly when tree=true
      // HTTP client wraps it in response.data
      const data = response.data;
      // Handle both direct array and wrapped responses
      if (Array.isArray(data)) {
        return data;
      }
      // If wrapped, try to extract the array
      if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }
      // Fallback to empty array
      return [];
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

    const response = await this.get(`${this.urlPath}/folders/public`, query, {});
    const data = response.data.data || response.data;
    // Support both new format (docs) and backward compatibility (folders)
    return data.folders || data.docs || [];
  }
}
