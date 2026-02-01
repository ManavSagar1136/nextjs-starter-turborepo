/**
 * @buildbase/database - Tag Types
 */

export interface CreateTagInput {
  name: string;
  color?: string | null;
  workspaceId?: string | null; // Optional for admin context (null for admin-created tags)
  userId: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string | null;
}

export interface ListTagsOptions {
  workspaceId?: string; // Optional for admin context
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTags {
  docs: Array<{
    id: string;
    name: string;
    slug: string;
    color: string | null;
    count: number;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
}

export interface TagWithDetails {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  count: number;
  createdAt: string;
  updatedAt: string;
}
