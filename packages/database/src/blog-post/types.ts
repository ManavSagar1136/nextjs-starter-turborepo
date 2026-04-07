/**
 * @buildbase/database - Blog Post Types
 */

export interface CreateBlogPostInput {
  title: string;
  slug?: string;
  description: string;
  excerpt?: string;
  content: string;
  image?: string;
  imageTitle?: string;
  featured?: boolean;
  published?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  folderId?: string;
}

export interface UpdateBlogPostInput {
  title?: string;
  slug?: string;
  description?: string;
  excerpt?: string;
  content?: string;
  image?: string | null;
  imageTitle?: string | null;
  featured?: boolean;
  featuredAt?: Date | null;
  published?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  folderId?: string | null;
}

export interface ListBlogPostsOptions {
  published?: boolean;
  featured?: boolean;
  folderId?: string;
  tagId?: string;
  authorId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedBlogPosts {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
