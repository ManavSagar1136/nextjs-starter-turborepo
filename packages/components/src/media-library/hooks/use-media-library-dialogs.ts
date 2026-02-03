"use client";

/**
 * Media Library Dialog Handlers Hook
 *
 * Provides dialog handlers for media library operations (folders, tags, assets).
 * This hook encapsulates all the dialog opening logic that's shared between
 * admin and user apps.
 *
 * @param options - Configuration options for the hook
 * @returns Object containing all dialog handler functions
 */

import { useCallback } from "react";
import { useDialogManager, COMMON_DIALOG_KEYS, type ConfirmationDialogProps } from "@buildbase/dialog-manager";
import {
  MEDIA_LIBRARY_DIALOG_KEYS,
  type CreateFolderDialogProps,
  type EditFolderDialogProps,
  type MoveFolderDialogProps,
  type CreateTagDialogProps,
  type EditTagDialogProps,
  type MoveAssetDialogProps,
  type AssignTagsDialogProps,
  type MediaUploadDialogProps,
  type AssetPreviewDialogProps,
  type UploadedFile,
  type Tag,
} from "@buildbase/dialog-manager/media-library";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import type { IAsset, IFolderTreeItem, ITag } from "../types";
import { useMediaLibrary } from "../context";

interface UseMediaLibraryDialogsOptions {
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
}

// ============================================================================
// Hook
// ============================================================================

export function useMediaLibraryDialogs({
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
}: UseMediaLibraryDialogsOptions) {
  const { openDialog } = useDialogManager();
  const { selectedFolderId, folderTree } = useMediaLibrary();

  // Get current folder name for display (shared helper)
  const getCurrentFolderName = useCallback(() => {
    if (!selectedFolderId || !folderTree.length) return null;

    const findFolder = (folders: IFolderTreeItem[], targetId: string): IFolderTreeItem | null => {
      for (const folder of folders) {
        if (folder.id === targetId) return folder;
        if (folder.children) {
          const found = findFolder(folder.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const folder = findFolder(folderTree, selectedFolderId);
    return folder?.name || null;
  }, [selectedFolderId, folderTree]);

  // ============================================================================
  // Folder Dialogs
  // ============================================================================

  const openCreateFolder = useCallback(
    (parentFolderId?: string | null, parentFolderName?: string | null) => {
      // If no parentFolderId provided, use current selected folder as default
      const defaultParentFolderId = parentFolderId !== undefined ? parentFolderId : selectedFolderId;
      const defaultParentFolderName = parentFolderName !== undefined ? parentFolderName : getCurrentFolderName();

      openDialog(MEDIA_LIBRARY_DIALOG_KEYS.CREATE_FOLDER, {
        parentFolderId: defaultParentFolderId,
        parentFolderName: defaultParentFolderName,
        folderTree: folderTreeQuery.data || [],
        isLoadingTree: folderTreeQuery.isLoading,
        isLoading: createFolder.isPending,
        onCreateFolder: async (data: { name: string; description?: string; parentFolderId?: string | null }) => {
          await createFolder.mutateAsync(data);
        },
      } as Omit<CreateFolderDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, createFolder, folderTreeQuery, selectedFolderId, getCurrentFolderName]
  );

  const openEditFolder = useCallback(
    (folder: IFolderTreeItem) => {
      openDialog(MEDIA_LIBRARY_DIALOG_KEYS.EDIT_FOLDER, {
        folderId: folder.id,
        currentName: folder.name,
        currentDescription: (folder as IFolderTreeItem & { description?: string | null }).description,
        isLoading: updateFolder.isPending,
        onUpdateFolder: async (data: { name: string; description?: string }) => {
          await updateFolder.mutateAsync({ folderId: folder.id, ...data });
        },
      } as Omit<EditFolderDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, updateFolder]
  );

  const openMoveFolder = useCallback(
    (folder: IFolderTreeItem) => {
      openDialog(MEDIA_LIBRARY_DIALOG_KEYS.MOVE_FOLDER, {
        folderId: folder.id,
        folderName: folder.name,
        folderTree: folderTreeQuery.data || [],
        isLoadingTree: folderTreeQuery.isLoading,
        isLoading: moveFolder.isPending,
        onMoveFolder: async (targetParentFolderId: string | null) => {
          await moveFolder.mutateAsync({ folderId: folder.id, targetParentFolderId });
        },
      } as Omit<MoveFolderDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, moveFolder, folderTreeQuery]
  );

  const handleDeleteFolder = useCallback(
    (folder: IFolderTreeItem) => {
      openDialog(COMMON_DIALOG_KEYS.CONFIRMATION, {
        variant: "delete",
        entity: "folder",
        itemName: folder.name,
        actionPayload: folder,
        confirmButtonProps: {
          onAction: async () => {
            try {
              await deleteFolder.mutateAsync({ folderId: folder.id, recursive: true });
              return { success: true, message: "Folder deleted successfully" };
            } catch (error) {
              return { success: false, message: "Failed to delete folder" };
            }
          },
        },
      } as Omit<ConfirmationDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, deleteFolder]
  );

  // ============================================================================
  // Tag Dialogs
  // ============================================================================

  const openCreateTag = useCallback(() => {
    openDialog(MEDIA_LIBRARY_DIALOG_KEYS.CREATE_TAG, {
      isLoading: createTag.isPending,
      onCreateTag: async (data: { name: string; color?: string }) => {
        await createTag.mutateAsync(data);
      },
    } as Omit<CreateTagDialogProps, "open" | "onOpenChange">);
  }, [openDialog, createTag]);

  const openEditTag = useCallback(
    (tag: { id: string; name: string; color?: string | null }) => {
      openDialog(MEDIA_LIBRARY_DIALOG_KEYS.EDIT_TAG, {
        tagId: tag.id,
        currentName: tag.name,
        currentColor: tag.color || undefined,
        isLoading: updateTag.isPending,
        onUpdateTag: async (data: { name?: string; color?: string }) => {
          await updateTag.mutateAsync({ tagId: tag.id, ...data });
        },
      } as Omit<EditTagDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, updateTag]
  );

  const handleDeleteTag = useCallback(
    (tag: { id: string; name: string }) => {
      openDialog(COMMON_DIALOG_KEYS.CONFIRMATION, {
        variant: "delete",
        entity: "tag",
        itemName: tag.name,
        actionPayload: tag,
        confirmButtonProps: {
          onAction: async () => {
            try {
              await deleteTag.mutateAsync(tag.id);
              return { success: true, message: "Tag deleted successfully" };
            } catch (error) {
              return { success: false, message: "Failed to delete tag" };
            }
          },
        },
      } as Omit<ConfirmationDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, deleteTag]
  );

  // ============================================================================
  // Asset Dialogs
  // ============================================================================

  const openMoveAsset = useCallback(
    (asset: IAsset) => {
      openDialog(MEDIA_LIBRARY_DIALOG_KEYS.MOVE_ASSET, {
        assetId: asset.id,
        assetName: asset.filename || asset.name,
        currentFolderId: asset.folder?.id,
        currentFolderPath: asset.folder?.name || "Root (No Folder)",
        folderTree: folderTreeQuery.data || [],
        isLoadingTree: folderTreeQuery.isLoading,
        isLoading: moveAssetToFolder.isPending,
        onMoveAsset: async (targetFolderId: string | null) => {
          await moveAssetToFolder.mutateAsync({ assetId: asset.id, folderId: targetFolderId });
        },
      } as Omit<MoveAssetDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, moveAssetToFolder, folderTreeQuery]
  );

  const openAssignTags = useCallback(
    (asset: IAsset) => {
      // Convert ITag[] to Tag[] format expected by dialog
      const allTags: Tag[] = (tagsQuery.data?.docs || []).map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color || null,
      }));

      const currentTags: Tag[] = (asset.tags || []).map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color || null,
      }));

      openDialog(MEDIA_LIBRARY_DIALOG_KEYS.ASSIGN_TAGS, {
        assetId: asset.id,
        currentTags,
        allTags,
        isLoadingTags: tagsQuery.isLoading,
        tagsError: tagsQuery.error ? "Failed to load tags" : undefined,
        onRetryLoadTags: () => tagsQuery.refetch(),
        isLoading: assignTags.isPending,
        onSaveTags: async (tagIds: string[]) => {
          await assignTags.mutateAsync({ assetId: asset.id, tagIds });
        },
      } as Omit<AssignTagsDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, assignTags, tagsQuery]
  );

  const handleDeleteAsset = useCallback(
    (asset: IAsset) => {
      openDialog(COMMON_DIALOG_KEYS.CONFIRMATION, {
        variant: "delete",
        entity: "asset",
        itemName: asset.filename || asset.name,
        actionPayload: asset,
        confirmButtonProps: {
          onAction: async () => {
            try {
              await deleteAsset.mutateAsync({ assetId: asset.id });
              return { success: true, message: "Asset deleted successfully" };
            } catch (error) {
              return { success: false, message: "Failed to delete asset" };
            }
          },
        },
      } as Omit<ConfirmationDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, deleteAsset]
  );

  // ============================================================================
  // Upload Dialog
  // ============================================================================

  const openUpload = useCallback(() => {
    let uploadFiles: UploadedFile[] = [];
    let isUploading = false;
    const currentFolderId = selectedFolderId;
    const currentFolderName = getCurrentFolderName();

    const handleUpload = async (files: File[]) => {
      isUploading = true;

      // Initialize upload files
      uploadFiles = files.map((file, i) => ({
        id: `upload-${Date.now()}-${i}`,
        file,
        status: "pending" as const,
        progress: 0,
      }));

      // Upload files sequentially with folder assignment
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;

        try {
          await uploadAsset.mutateAsync({
            file,
            options: {
              folderId: currentFolderId,
              makePublic: false,
            },
          });
        } catch (error) {
          console.error("Upload error:", error);
        }
      }

      isUploading = false;
    };

    openDialog(MEDIA_LIBRARY_DIALOG_KEYS.MEDIA_UPLOAD, {
      folderId: currentFolderId || undefined,
      folderName: currentFolderName || undefined,
      isUploading,
      files: uploadFiles,
      onUpload: handleUpload,
      onComplete: () => {
        // Dialog will close automatically
      },
    } as Omit<MediaUploadDialogProps, "open" | "onOpenChange">);
  }, [openDialog, uploadAsset, selectedFolderId, getCurrentFolderName]);

  // ============================================================================
  // Preview Dialog
  // ============================================================================

  const openPreview = useCallback(
    (asset: IAsset) => {
      openDialog(MEDIA_LIBRARY_DIALOG_KEYS.ASSET_PREVIEW, {
        asset,
        onDownload: () => window.open(asset.url, "_blank"),
        onMove: () => openMoveAsset(asset),
        onAssignTags: () => openAssignTags(asset),
        onTogglePrivacy: async () => {
          await togglePrivacy.mutateAsync({
            assetId: asset.id,
            makePublic: !asset.isPublic,
          });
        },
        onDelete: () => handleDeleteAsset(asset),
      } as Omit<AssetPreviewDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, openMoveAsset, openAssignTags, togglePrivacy, handleDeleteAsset]
  );

  // ============================================================================
  // Toggle Privacy
  // ============================================================================

  const handleTogglePrivacy = useCallback(
    async (asset: IAsset) => {
      await togglePrivacy.mutateAsync({
        assetId: asset.id,
        makePublic: !asset.isPublic,
      });
    },
    [togglePrivacy]
  );

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  const handleBulkDelete = useCallback(
    (assetIds: string[]) => {
      openDialog(COMMON_DIALOG_KEYS.CONFIRMATION, {
        variant: "delete",
        entity: "assets",
        itemName: `${assetIds.length} ${assetIds.length === 1 ? "asset" : "assets"}`,
        actionPayload: assetIds,
        confirmButtonProps: {
          onAction: async () => {
            try {
              const result = await bulkDeleteAssets.mutateAsync(assetIds);
              if (result.failureCount > 0) {
                return {
                  success: false,
                  message: `Deleted ${result.successCount} of ${assetIds.length} assets. ${result.failureCount} failed.`,
                };
              }
              return { success: true, message: `Successfully deleted ${result.successCount} assets` };
            } catch (error) {
              return { success: false, message: "Failed to delete assets" };
            }
          },
        },
      } as Omit<ConfirmationDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, bulkDeleteAssets]
  );

  const handleBulkMove = useCallback(
    (assetIds: string[]) => {
      openDialog(MEDIA_LIBRARY_DIALOG_KEYS.MOVE_ASSET, {
        assetId: assetIds[0] || "",
        assetName: `${assetIds.length} ${assetIds.length === 1 ? "asset" : "assets"}`,
        currentFolderId: null,
        currentFolderPath: "Multiple folders",
        folderTree: folderTreeQuery.data || [],
        isLoadingTree: folderTreeQuery.isLoading,
        isLoading: bulkMoveAssets.isPending,
        onMoveAsset: async (targetFolderId: string | null) => {
          await bulkMoveAssets.mutateAsync({ assetIds, folderId: targetFolderId });
        },
      } as Omit<MoveAssetDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, bulkMoveAssets, folderTreeQuery]
  );

  const handleBulkAssignTags = useCallback(
    (assetIds: string[]) => {
      // Convert ITag[] to Tag[] format expected by dialog
      const allTags: Tag[] = (tagsQuery.data?.docs || []).map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color || null,
      }));

      openDialog(MEDIA_LIBRARY_DIALOG_KEYS.ASSIGN_TAGS, {
        assetId: assetIds[0] || "",
        currentTags: [],
        allTags,
        isLoadingTags: tagsQuery.isLoading,
        tagsError: tagsQuery.error ? "Failed to load tags" : undefined,
        onRetryLoadTags: () => tagsQuery.refetch(),
        isLoading: bulkAssignTags.isPending,
        onSaveTags: async (tagIds: string[]) => {
          await bulkAssignTags.mutateAsync({ assetIds, tagIds });
        },
      } as Omit<AssignTagsDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, bulkAssignTags, tagsQuery]
  );

  return {
    // Folder dialogs
    openCreateFolder,
    openEditFolder,
    openMoveFolder,
    handleDeleteFolder,

    // Tag dialogs
    openCreateTag,
    openEditTag,
    handleDeleteTag,

    // Asset dialogs
    openMoveAsset,
    openAssignTags,
    handleDeleteAsset,
    openPreview,
    handleTogglePrivacy,

    // Upload
    openUpload,

    // Bulk operations
    handleBulkDelete,
    handleBulkMove,
    handleBulkAssignTags,
  };
}
