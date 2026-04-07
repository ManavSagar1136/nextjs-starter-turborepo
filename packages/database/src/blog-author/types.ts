/**
 * @buildbase/database - Blog Author Types
 */

import type { BlogAuthor } from "@prisma/client";

export interface CreateBlogAuthorInput {
  name: string;
  username: string;
  image?: string;
  links?: Record<string, string>;
}

export interface UpdateBlogAuthorInput {
  name?: string;
  username?: string;
  image?: string;
  links?: Record<string, string> | null;
}

export interface ListBlogAuthorsOptions {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedBlogAuthors {
  data: BlogAuthor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
