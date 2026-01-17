/**
 * DocPostService - API-based implementation
 * Uses API calls instead of direct Prisma access
 */

import { API } from "@/services";
import type { IDocPost, IDocListResponse } from "@/services/docs";
import type { PaginationResponse } from "@buildbase/http-client/types";

export interface CreateDocPostInput {
  title: string;
  slug?: string;
  subtitle?: string;
  description?: string | null;
  content: string;
  folderId?: string | null;
  order?: number | null;
  published?: boolean;
  publishedAt?: Date;
  seoTitle: string;
  seoDescription?: string | null;
  seoKeywords?: string[];
}

export interface UpdateDocPostInput {
  title?: string;
  slug?: string;
  subtitle?: string | null;
  description?: string | null;
  content?: string;
  folderId?: string | null;
  order?: number | null;
  published?: boolean;
  publishedAt?: Date | null;
  seoTitle?: string;
  seoDescription?: string | null;
  seoKeywords?: string[];
}

export interface ListDocPostsOptions {
  published?: boolean;
  includeDeleted?: boolean;
  limit?: number;
  folderId?: string;
}

export interface ListDocPostsResult {
  posts: IDocPost[];
  total: number;
}

export class DocPostService {
  /**
   * Get document post by path (folder path + slug)
   */
  static async getDocPostByPath(
    path: string,
    includeDeleted = false,
  ): Promise<(IDocPost & { url?: string }) | null> {
    try {
      const post = await API.docs.getByPath(path);
      if (!post || (!includeDeleted && !post.published)) {
        return null;
      }
      return post;
    } catch (error) {
      console.error("Error getting doc post by path:", error);
      return null;
    }
  }

  /**
   * List document posts
   */
  static async listDocPosts(
    options: ListDocPostsOptions = {},
  ): Promise<ListDocPostsResult> {
    try {
      const result = await API.docs.getAllPublished({
        folderId: options.folderId,
        $limit: options.limit || 1000,
      });

      const posts = Array.isArray(result)
        ? result
        : result?.data || result?.docs || [];

      // Filter by published if specified
      const filteredPosts = options.published
        ? posts.filter((p: IDocPost) => p.published)
        : posts;

      return {
        posts: filteredPosts,
        total: filteredPosts.length,
      };
    } catch (error) {
      console.error("Error listing doc posts:", error);
      return { posts: [], total: 0 };
    }
  }
}
