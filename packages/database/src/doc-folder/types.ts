/**
 * @buildbase/database - Doc Folder Types
 */

import type { DocFolder } from "@prisma/client";

export interface CreateDocFolderInput {
  name: string;
  slug?: string;
  parentFolderId?: string;
}

export interface UpdateDocFolderInput {
  name?: string;
  slug?: string;
  parentFolderId?: string | null;
}

export interface ListDocFoldersOptions {
  parentFolderId?: string | null;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedDocFolders {
  data: DocFolder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DocFolderTreeItem {
  id: string;
  name: string;
  slug: string;
  path: string | null;
  parentFolderId: string | null;
  children: DocFolderTreeItem[];
}
