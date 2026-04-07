/**
 * ChangelogPostService - Database-direct implementation for server-side use.
 */

import { prisma, listChangelogPosts as dbListChangelogPosts, getChangelogPostBySlug as dbGetBySlug } from "@buildbase/database";
import { computeChangelogUrl } from "./changelog-url.service";

export interface ListChangelogPostsOptions {
  published?: boolean;
  includeDeleted?: boolean;
  limit?: number;
  page?: number;
}

export interface ListChangelogPostsResult {
  posts: any[];
  total: number;
}

export class ChangelogPostService {
  /**
   * List changelog posts
   */
  static async listChangelogPosts(
    options: ListChangelogPostsOptions = {},
  ): Promise<ListChangelogPostsResult> {
    try {
      const result = await dbListChangelogPosts(prisma, {
        published: options.published,
        includeDeleted: options.includeDeleted ?? false,
        limit: options.limit || 1000,
        page: options.page || 1,
      });

      const posts = result.data.map((post: any) => ({
        ...post,
        url: computeChangelogUrl(post),
      }));

      return { posts, total: result.total };
    } catch (error) {
      console.error("Error listing changelog posts:", error);
      return { posts: [], total: 0 };
    }
  }

  /**
   * Get a single published changelog post by slug
   */
  static async getChangelogPostBySlug(slug: string): Promise<any | null> {
    try {
      const post = await dbGetBySlug(prisma, slug);
      if (!post || post.deleted) return null;
      return { ...post, url: computeChangelogUrl(post) };
    } catch (error) {
      console.error("Error getting changelog post by slug:", error);
      return null;
    }
  }

  /**
   * Get all published posts for SSG (generateStaticParams)
   */
  static async getAllPublishedForSSG(): Promise<{ id: string; slug: string }[]> {
    try {
      const result = await dbListChangelogPosts(prisma, {
        published: true,
        includeDeleted: false,
        limit: 10000,
      });
      return result.data.map((post: any) => ({ id: post.id, slug: post.slug }));
    } catch {
      return [];
    }
  }
}
