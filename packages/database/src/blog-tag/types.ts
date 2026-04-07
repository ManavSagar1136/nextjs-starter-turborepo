/**
 * @buildbase/database - Blog Tag Types
 */

import type { BlogTag } from "@prisma/client";

export interface CreateBlogTagInput {
  title: string;
  slug?: string;
  isPublic?: boolean;
}

export interface UpdateBlogTagInput {
  title?: string;
  slug?: string;
  isPublic?: boolean;
}

export interface ListBlogTagsOptions {
  isPublic?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedBlogTags {
  data: BlogTag[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
