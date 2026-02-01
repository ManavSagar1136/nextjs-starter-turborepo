/**
 * @buildbase/database - Folder Types
 */

import type { AssetFolder } from "../generated/client";

export interface CreateFolderInput {
  name: string;
  description?: string;
  parentFolderId?: string | null;
  workspaceId?: string | null; // Optional for admin context (null for admin-created folders)
  userId: string;
}

export interface UpdateFolderInput {
  name?: string;
  description?: string | null;
  parentFolderId?: string | null;
}

export interface ListFoldersOptions {
  workspaceId?: string; // Optional for admin context
  parentFolderId?: string | null;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedFolders {
  docs: Array<{
    id: string;
    name: string;
    description: string | null;
    parentFolderId: string | null;
    _count: {
      assets: number;
      children: number;
    };
    createdAt: string;
    updatedAt: string;
  }>;
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FolderTreeItem {
  id: string;
  name: string;
  children: FolderTreeItem[];
  _count?: {
    assets: number;
    children: number;
  };
}

export interface FolderWithDetails {
  id: string;
  name: string;
  description: string | null;
  parentFolderId: string | null;
  parent: { id: string; name: string } | null;
  path: Array<{ id: string; name: string }>;
  _count: {
    assets: number;
    children: number;
  };
  createdAt: string;
  updatedAt: string;
}
