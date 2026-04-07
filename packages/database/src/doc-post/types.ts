/**
 * @buildbase/database - Doc Post Types
 */

export interface CreateDocPostInput {
  title: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  content: string;
  order?: number;
  published?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  folderId?: string;
}

export interface UpdateDocPostInput {
  title?: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  content?: string;
  order?: number | null;
  published?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  folderId?: string | null;
}

export interface ListDocPostsOptions {
  published?: boolean;
  folderId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedDocPosts {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
