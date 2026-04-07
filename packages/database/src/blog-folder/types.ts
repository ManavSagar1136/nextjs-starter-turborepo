/**
 * @buildbase/database - Blog Folder Types
 */

import type { BlogFolder } from "@prisma/client";

export interface CreateBlogFolderInput {
  name: string;
  slug?: string;
  parentFolderId?: string;
}

export interface UpdateBlogFolderInput {
  name?: string;
  slug?: string;
  parentFolderId?: string | null;
}

export interface ListBlogFoldersOptions {
  parentFolderId?: string | null;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedBlogFolders {
  data: BlogFolder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BlogFolderTreeItem {
  id: string;
  name: string;
  slug: string;
  path: string | null;
  parentFolderId: string | null;
  children: BlogFolderTreeItem[];
}
