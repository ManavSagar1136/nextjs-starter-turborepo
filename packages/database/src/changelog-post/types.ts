/**
 * @buildbase/database - Changelog Post Types
 */

export interface CreateChangelogPostInput {
  title: string;
  slug: string;
  version: string;
  description?: string | null;
  content: string;
  published?: boolean;
  publishedAt?: Date | null;
  releaseDate?: Date | null;
  seoTitle?: string;
  seoDescription?: string | null;
  seoKeywords?: string[];
  createdById?: string;
  updatedById?: string;
}

export interface UpdateChangelogPostInput {
  title?: string;
  slug?: string;
  version?: string;
  description?: string | null;
  content?: string;
  published?: boolean;
  publishedAt?: Date | null;
  releaseDate?: Date | null;
  seoTitle?: string;
  seoDescription?: string | null;
  seoKeywords?: string[];
  updatedById?: string;
}

export interface ListChangelogPostsOptions {
  published?: boolean;
  search?: string;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedChangelogPosts {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
