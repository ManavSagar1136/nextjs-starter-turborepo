/**
 * ChangelogPostService - Database-direct implementation for server-side use.
 */

import {
  prisma,
  listChangelogPosts as dbListChangelogPosts,
  getChangelogPostBySlug as dbGetBySlug,
} from "@buildbase/database";
import { computeChangelogUrl } from "./changelog-url.service";

export interface ChangelogPostRecord {
  id: string;
  title: string;
  slug: string;
  version: string;
  description: string | null;
  content: string;
  published: boolean;
  publishedAt: Date | null;
  releaseDate: Date | null;
  deleted: boolean;
  seoTitle: string;
  seoDescription: string | null;
  seoKeywords: string[];
  createdAt: Date;
  updatedAt: Date;
  url: string;
}

export interface ListChangelogPostsOptions {
  published?: boolean;
  includeDeleted?: boolean;
  limit?: number;
  page?: number;
}

export interface ListChangelogPostsResult {
  posts: ChangelogPostRecord[];
  total: number;
}

function attachUrl(post: any): ChangelogPostRecord {
  return { ...post, url: computeChangelogUrl(post) };
}

export class ChangelogPostService {
  /**
   * List changelog posts (server-side, DB-direct).
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

      return {
        posts: result.data.map(attachUrl),
        total: result.total,
      };
    } catch (error) {
      // Only swallow connection errors at build time
      const code = (error as any)?.code || (error as any)?.cause?.code;
      if (code !== "ECONNREFUSED") {
        console.error("[ChangelogPostService] listChangelogPosts error:", error);
      }
      return { posts: [], total: 0 };
    }
  }

  /**
   * Get a single changelog post by slug.
   */
  static async getChangelogPostBySlug(slug: string): Promise<ChangelogPostRecord | null> {
    const post = await dbGetBySlug(prisma, slug);
    if (!post || post.deleted) return null;
    return attachUrl(post);
  }

  /**
   * Get all published slugs for SSG (generateStaticParams).
   */
  static async getAllPublishedForSSG(): Promise<{ id: string; slug: string }[]> {
    try {
      const result = await dbListChangelogPosts(prisma, {
        published: true,
        includeDeleted: false,
        limit: 10000,
      });
      return result.data.map((post: any) => ({ id: post.id, slug: post.slug }));
    } catch (error) {
      const code = (error as any)?.code || (error as any)?.cause?.code;
      if (code !== "ECONNREFUSED") {
        console.error("[ChangelogPostService] getAllPublishedForSSG error:", error);
      }
      return [];
    }
  }
}
