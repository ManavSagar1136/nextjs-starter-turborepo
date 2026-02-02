/**
 * @buildbase/database - Asset Types
 */

import type { Asset } from "../generated/client";

export interface ListAssetsOptions {
  workspaceId?: string; // Optional for admin context
  folderId?: string | null;
  tagIds?: string[];
  search?: string;
  contentType?: string | string[];
  isPublic?: boolean;
  sortBy?: "name" | "size" | "createdAt" | "updatedAt" | "contentType";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PaginatedAssets {
  docs: Array<{
    id: string;
    name: string;
    filename: string;
    url: string;
    path: string;
    size: number;
    contentType: string;
    isPublic: boolean;
    metadata: Record<string, unknown> | null;
    folder: { id: string; name: string } | null;
    tags: Array<{ id: string; name: string; slug: string; color: string | null }>;
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

export interface AssetWithDetails {
  id: string;
  filename: string;
  url: string;
  path: string;
  size: number;
  contentType: string;
  isPublic: boolean;
  metadata: Record<string, unknown> | null;
  folder: { id: string; name: string } | null;
  tags: Array<{ id: string; name: string; slug: string; color: string | null }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateAssetInput {
  folderId?: string | null;
  tagIds?: string[];
  filename?: string;
  metadata?: Record<string, unknown>;
  isPublic?: boolean;
  /** Skip workspace validation for admin operations */
  skipWorkspaceValidation?: boolean;
}
