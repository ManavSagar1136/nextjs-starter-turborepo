"use client";

/**
 * AssetsPageContent Component
 *
 * Shared component that provides the media library UI with all dialog handlers.
 * This component encapsulates all the dialog opening logic and media library
 * interactions that are common between admin and user apps.
 *
 * @param options - Configuration options including mutations and queries
 */

import { MediaLibrary } from "../MediaLibrary";
import { useMediaLibraryDialogs } from "../hooks/use-media-library-dialogs";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import type { IFolderTreeItem, ITag } from "../types";

// ============================================================================
// Types
// ============================================================================

interface AssetsPageContentProps {
  // Mutations
  createFolder: UseMutationResult<any, Error, { name: string; parentFolderId?: string | null; description?: string }>;
  updateFolder: UseMutationResult<any, Error, { folderId: string; name?: string; description?: string }>;
  deleteFolder: UseMutationResult<any, Error, { folderId: string; recursive?: boolean }>;
  moveFolder: UseMutationResult<any, Error, { folderId: string; targetParentFolderId: string | null }>;
  deleteAsset: UseMutationResult<any, Error, { assetId: string; force?: boolean }>;
  togglePrivacy: UseMutationResult<any, Error, { assetId: string; makePublic: boolean }>;
  moveAssetToFolder: UseMutationResult<any, Error, { assetId: string; folderId: string | null }>;
  assignTags: UseMutationResult<any, Error, { assetId: string; tagIds: string[] }>;
  uploadAsset: UseMutationResult<
    any,
    Error,
    { file: File; options?: { folderId?: string | null; makePublic?: boolean } }
  >;
  createTag: UseMutationResult<any, Error, { name: string; color?: string }>;
  updateTag: UseMutationResult<any, Error, { tagId: string; name?: string; color?: string }>;
  deleteTag: UseMutationResult<any, Error, string>;
  bulkDeleteAssets: UseMutationResult<any, Error, string[]>;
  bulkMoveAssets: UseMutationResult<any, Error, { assetIds: string[]; folderId: string | null }>;
  bulkAssignTags: UseMutationResult<any, Error, { assetIds: string[]; tagIds: string[] }>;

  // Queries for dialogs
  folderTreeQuery: UseQueryResult<IFolderTreeItem[], Error>;
  tagsQuery: UseQueryResult<{ docs: ITag[]; total: number }, Error>;

  // Optional props
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function AssetsPageContent({
  createFolder,
  updateFolder,
  deleteFolder,
  moveFolder,
  deleteAsset,
  togglePrivacy,
  moveAssetToFolder,
  assignTags,
  uploadAsset,
  createTag,
  updateTag,
  deleteTag,
  bulkDeleteAssets,
  bulkMoveAssets,
  bulkAssignTags,
  folderTreeQuery,
  tagsQuery,
  className = "h-[calc(100vh-4rem)]",
}: AssetsPageContentProps) {
  const {
    openCreateFolder,
    openEditFolder,
    openMoveFolder,
    handleDeleteFolder,
    openCreateTag,
    openEditTag,
    handleDeleteTag,
    openMoveAsset,
    openAssignTags,
    handleDeleteAsset,
    openUpload,
    openPreview,
    handleTogglePrivacy,
    handleBulkDelete,
    handleBulkMove,
    handleBulkAssignTags,
  } = useMediaLibraryDialogs({
    createFolder,
    updateFolder,
    deleteFolder,
    moveFolder,
    deleteAsset,
    togglePrivacy,
    moveAssetToFolder,
    assignTags,
    uploadAsset,
    createTag,
    updateTag,
    deleteTag,
    bulkDeleteAssets,
    bulkMoveAssets,
    bulkAssignTags,
    folderTreeQuery,
    tagsQuery,
  });

  return (
    <MediaLibrary
      className={className}
      onUpload={openUpload}
      onCreateFolder={() => openCreateFolder()}
      onEditFolder={openEditFolder}
      onDeleteFolder={handleDeleteFolder}
      onMoveFolder={openMoveFolder}
      onBulkDelete={handleBulkDelete}
      onBulkMove={handleBulkMove}
      onBulkAssignTags={handleBulkAssignTags}
      onCreateTag={openCreateTag}
      onEditTag={openEditTag}
      onDeleteTag={handleDeleteTag}
    />
  );
}
