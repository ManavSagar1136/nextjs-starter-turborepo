"use client";

import { useState, useCallback } from "react";
import { MediaLibrary, MediaLibraryProvider, type IAsset, type IFolderTreeItem } from "@buildbase/components/media-library";
import {
  MEDIA_LIBRARY_DIALOG_KEYS,
  type UploadedFile,
  type CreateFolderDialogProps,
  type EditFolderDialogProps,
  type MoveFolderDialogProps,
  type CreateTagDialogProps,
  type EditTagDialogProps,
  type MoveAssetDialogProps,
  type AssignTagsDialogProps,
  type MediaUploadDialogProps,
  type AssetPreviewDialogProps,
} from "@buildbase/dialog-manager/media-library";
import { useDialogManager, COMMON_DIALOG_KEYS, type ConfirmationDialogProps } from "@buildbase/dialog-manager";

import { API } from "@/services";
import {
  useAssets,
  useFolderTree,
  useTags,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
  useMoveFolder,
  useDeleteAsset,
  useToggleAssetPrivacy,
  useMoveAssetToFolder,
  useAssignTagsToAsset,
  useUploadAsset,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  useBulkDeleteAssets,
  useBulkMoveAssets,
  useBulkAssignTags,
} from "@/hooks/use-media-library";

// ============================================================================
// Assets Page Content (with provider context)
// ============================================================================

function AssetsPageContent() {
  const { openDialog } = useDialogManager();

  // Mutations
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const moveFolder = useMoveFolder();
  const deleteAsset = useDeleteAsset();
  const togglePrivacy = useToggleAssetPrivacy();
  const moveAssetToFolder = useMoveAssetToFolder();
  const assignTags = useAssignTagsToAsset();
  const uploadAsset = useUploadAsset();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const bulkDeleteAssets = useBulkDeleteAssets();
  const bulkMoveAssets = useBulkMoveAssets();
  const bulkAssignTags = useBulkAssignTags();

  // Queries for dialogs
  const folderTreeQuery = useFolderTree();
  const tagsQuery = useTags();

  // ============================================================================
  // Folder Dialogs
  // ============================================================================

  const openCreateFolder = useCallback(
    (parentFolderId?: string | null, parentFolderName?: string | null) => {
      openDialog(MEDIA_LIBRARY_DIALOG_KEYS.CREATE_FOLDER, {
        parentFolderId,
        parentFolderName,
        folderTree: folderTreeQuery.data || [],
        isLoadingTree: folderTreeQuery.isLoading,
        isLoading: createFolder.isPending,
        onCreateFolder: async (data: { name: string; description?: string; parentFolderId?: string | null }) => {
          await createFolder.mutateAsync(data);
        },
      } as Omit<CreateFolderDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, createFolder, folderTreeQuery]
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
      openDialog(MEDIA_LIBRARY_DIALOG_KEYS.ASSIGN_TAGS, {
        assetId: asset.id,
        currentTags: asset.tags || [],
        allTags: tagsQuery.data?.docs || [],
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

    const handleUpload = async (files: File[]) => {
      isUploading = true;

      // Initialize upload files
      uploadFiles = files.map((file, i) => ({
        id: `upload-${Date.now()}-${i}`,
        file,
        status: "pending" as const,
        progress: 0,
      }));

      // Upload files sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;

        try {
          await uploadAsset.mutateAsync({ file });
        } catch (error) {
          console.error("Upload error:", error);
        }
      }

      isUploading = false;
    };

    openDialog(MEDIA_LIBRARY_DIALOG_KEYS.MEDIA_UPLOAD, {
      isUploading,
      files: uploadFiles,
      onUpload: handleUpload,
      onComplete: () => {
        // Dialog will close automatically
      },
    } as Omit<MediaUploadDialogProps, "open" | "onOpenChange">);
  }, [openDialog, uploadAsset]);

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
      openDialog(MEDIA_LIBRARY_DIALOG_KEYS.ASSIGN_TAGS, {
        assetId: assetIds[0] || "",
        currentTags: [],
        allTags: tagsQuery.data?.docs || [],
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

  return (
    <MediaLibrary
      className="h-[calc(100vh-4rem)]"
      onUpload={openUpload}
      onCreateFolder={() => openCreateFolder()}
      onEditFolder={openEditFolder}
      onDeleteFolder={handleDeleteFolder}
      onMoveFolder={openMoveFolder}
      onBulkDelete={handleBulkDelete}
      onBulkMove={handleBulkMove}
      onBulkAssignTags={handleBulkAssignTags}
    />
  );
}

// ============================================================================
// Main Page (with data fetching)
// ============================================================================

export default function AssetsPage() {
  // Fetch data
  const [queryParams] = useState<{
    folderId?: string | null;
    tagIds?: string[];
    search?: string;
    contentType?: string[];
    $page?: number;
    $limit?: number;
  }>({ $page: 1, $limit: 20 });

  const assetsQuery = useAssets(queryParams);
  const folderTreeQuery = useFolderTree();
  const tagsQuery = useTags();

  // Mutations for provider handlers
  const deleteAssetMutation = useDeleteAsset();
  const togglePrivacyMutation = useToggleAssetPrivacy();
  const moveAssetToFolderMutation = useMoveAssetToFolder();
  const assignTagsMutation = useAssignTagsToAsset();

  const { openDialog } = useDialogManager();

  // Asset action handlers for provider
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
              await deleteAssetMutation.mutateAsync({ assetId: asset.id });
              return { success: true, message: "Asset deleted successfully" };
            } catch (error) {
              return { success: false, message: "Failed to delete asset" };
            }
          },
        },
      } as Omit<ConfirmationDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, deleteAssetMutation]
  );

  const handleTogglePrivacy = useCallback(
    async (asset: IAsset) => {
      await togglePrivacyMutation.mutateAsync({
        assetId: asset.id,
        makePublic: !asset.isPublic,
      });
    },
    [togglePrivacyMutation]
  );

  const handlePreviewAsset = useCallback(
    (asset: IAsset) => {
      openDialog(MEDIA_LIBRARY_DIALOG_KEYS.ASSET_PREVIEW, {
        asset,
        onDownload: () => window.open(asset.url, "_blank"),
      } as Omit<AssetPreviewDialogProps, "open" | "onOpenChange">);
    },
    [openDialog]
  );

  const handleDownloadAsset = useCallback((asset: IAsset) => {
    window.open(asset.url, "_blank");
  }, []);

  const handleMoveAsset = useCallback(
    (asset: IAsset) => {
      openDialog(MEDIA_LIBRARY_DIALOG_KEYS.MOVE_ASSET, {
        assetId: asset.id,
        assetName: asset.filename || asset.name,
        currentFolderId: asset.folder?.id,
        currentFolderPath: asset.folder?.name || "Root (No Folder)",
        folderTree: folderTreeQuery.data || [],
        isLoadingTree: folderTreeQuery.isLoading,
        onMoveAsset: async (targetFolderId: string | null) => {
          await moveAssetToFolderMutation.mutateAsync({ assetId: asset.id, folderId: targetFolderId });
        },
      } as Omit<MoveAssetDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, folderTreeQuery, moveAssetToFolderMutation]
  );

  const handleAssignTags = useCallback(
    (asset: IAsset) => {
      openDialog(MEDIA_LIBRARY_DIALOG_KEYS.ASSIGN_TAGS, {
        assetId: asset.id,
        currentTags: asset.tags || [],
        allTags: tagsQuery.data?.docs || [],
        isLoadingTags: tagsQuery.isLoading,
        onSaveTags: async (tagIds: string[]) => {
          await assignTagsMutation.mutateAsync({ assetId: asset.id, tagIds });
        },
      } as Omit<AssignTagsDialogProps, "open" | "onOpenChange">);
    },
    [openDialog, tagsQuery, assignTagsMutation]
  );

  return (
    <MediaLibraryProvider
      api={API.mediaLibrary}
      assets={assetsQuery.data || null}
      folderTree={folderTreeQuery.data || []}
      tags={tagsQuery.data?.docs || []}
      isLoadingAssets={assetsQuery.isLoading}
      isLoadingFolders={folderTreeQuery.isLoading}
      isLoadingTags={tagsQuery.isLoading}
      onRefreshAssets={() => assetsQuery.refetch()}
      onRefreshFolders={() => folderTreeQuery.refetch()}
      onRefreshTags={() => tagsQuery.refetch()}
      onDeleteAsset={handleDeleteAsset}
      onTogglePrivacy={handleTogglePrivacy}
      onPreviewAsset={handlePreviewAsset}
      onDownloadAsset={handleDownloadAsset}
      onMoveAsset={handleMoveAsset}
      onAssignTags={handleAssignTags}
    >
      <AssetsPageContent />
    </MediaLibraryProvider>
  );
}
