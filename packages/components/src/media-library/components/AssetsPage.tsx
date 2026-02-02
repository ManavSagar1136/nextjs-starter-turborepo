"use client";

/**
 * AssetsPage Component
 *
 * Complete page component for the media library/assets page.
 * This component encapsulates all page-level logic including:
 * - Provider setup with queries and mutations
 * - Query params state management
 * - Asset action handlers
 * - Folder/tag/asset queries
 *
 * This component is shared between admin and user apps to eliminate duplication.
 *
 * @example
 * ```tsx
 * import { AssetsPage } from "@buildbase/components/media-library";
 * import { API } from "@/services";
 *
 * export default function Page() {
 *   return <AssetsPage api={API.mediaLibrary} />;
 * }
 * ```
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { MediaLibraryProvider, useMediaLibrary } from "../context";
import { AssetsQuerySync } from "./AssetsQuerySync";
import { AssetsPageContent } from "./AssetsPageContent";
import { createMediaLibraryHooks } from "../hooks/use-media-library-queries";
import { useMediaLibraryDialogs } from "../hooks/use-media-library-dialogs";
import type { IAsset, IMediaLibraryApi } from "../types";
import { useDialogManager, COMMON_DIALOG_KEYS, type ConfirmationDialogProps } from "@buildbase/dialog-manager";

// ============================================================================
// Types
// ============================================================================

export interface AssetsPageProps {
  /** The media library API implementation */
  api: IMediaLibraryApi;
  /** Optional initial folder ID */
  initialFolderId?: string | null;
  /** Optional className for the page container */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function AssetsPage({ api, initialFolderId = null, className }: AssetsPageProps) {
  // Create hooks using the shared factory - memoize to prevent recreation on every render
  const hooks = useMemo(() => createMediaLibraryHooks(api), [api]);

  // Fetch data
  const folderTreeQuery = hooks.useFolderTree();
  const tagsQuery = hooks.useTags();

  // State for query params - will be updated by AssetsQuerySync when folder changes
  const [queryParams, setQueryParams] = useState<{
    folderId?: string | null;
    tagIds?: string[];
    search?: string;
    contentType?: string[];
    $page?: number;
    $limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }>({ $page: 1, $limit: 10 });

  // Assets query - will refetch when queryParams change
  const assetsQuery = hooks.useAssets(queryParams);

  // Mutations for provider handlers
  const deleteAssetMutation = hooks.useDeleteAsset();
  const togglePrivacyMutation = hooks.useToggleAssetPrivacy();
  const duplicateAssetMutation = hooks.useDuplicateAsset();

  const { openDialog } = useDialogManager();

  // Create refs to store dialog handlers (set by AssetActionConnector inside provider)
  const dialogHandlersRef = useRef<{
    openPreview?: (asset: IAsset) => void;
    openMoveAsset?: (asset: IAsset) => void;
    openAssignTags?: (asset: IAsset) => void;
    handleDeleteAsset?: (asset: IAsset) => void;
    handleTogglePrivacy?: (asset: IAsset) => Promise<void>;
  }>({});

  // Asset action handlers for provider - use refs to call dialog handlers
  const handleDeleteAsset = useCallback(
    (asset: IAsset) => {
      if (dialogHandlersRef.current.handleDeleteAsset) {
        dialogHandlersRef.current.handleDeleteAsset(asset);
      } else {
        // Fallback to direct dialog
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
      }
    },
    [openDialog, deleteAssetMutation]
  );

  const handleTogglePrivacy = useCallback(
    async (asset: IAsset) => {
      if (dialogHandlersRef.current.handleTogglePrivacy) {
        await dialogHandlersRef.current.handleTogglePrivacy(asset);
      } else {
        // Fallback
        await togglePrivacyMutation.mutateAsync({
          assetId: asset.id,
          makePublic: !asset.isPublic,
        });
      }
    },
    [togglePrivacyMutation]
  );

  const handlePreviewAsset = useCallback((asset: IAsset) => {
    if (dialogHandlersRef.current.openPreview) {
      dialogHandlersRef.current.openPreview(asset);
    }
  }, []);

  const handleDownloadAsset = useCallback((asset: IAsset) => {
    window.open(asset.url, "_blank");
  }, []);

  const handleMoveAsset = useCallback((asset: IAsset) => {
    if (dialogHandlersRef.current.openMoveAsset) {
      dialogHandlersRef.current.openMoveAsset(asset);
    }
  }, []);

  const handleAssignTags = useCallback((asset: IAsset) => {
    if (dialogHandlersRef.current.openAssignTags) {
      dialogHandlersRef.current.openAssignTags(asset);
    }
  }, []);

  const handleEditAsset = useCallback((asset: IAsset) => {
    // Edit metadata dialog - need to check if this exists
    // For now, we'll use a placeholder
    console.log("Edit metadata not yet implemented", asset);
  }, []);

  const handleDuplicateAsset = useCallback(
    async (asset: IAsset) => {
      try {
        await duplicateAssetMutation.mutateAsync(asset.id);
      } catch (error) {
        console.error("Failed to duplicate asset:", error);
        throw error;
      }
    },
    [duplicateAssetMutation]
  );

  return (
    <MediaLibraryProvider
      api={api}
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
      onEditAsset={handleEditAsset}
      onDuplicateAsset={handleDuplicateAsset}
      initialFolderId={initialFolderId}
    >
      <AssetsQuerySync setQueryParams={setQueryParams} />
      <AssetActionConnector hooks={hooks} dialogHandlersRef={dialogHandlersRef} />
      <AssetsPageContentWrapper hooks={hooks} className={className} />
    </MediaLibraryProvider>
  );
}

// ============================================================================
// Internal: AssetActionConnector
// Connects asset actions from context to dialog handlers
// This component must be inside MediaLibraryProvider to use useMediaLibrary
// ============================================================================

interface AssetActionConnectorProps {
  hooks: ReturnType<typeof createMediaLibraryHooks>;
  dialogHandlersRef: React.MutableRefObject<{
    openPreview?: (asset: IAsset) => void;
    openMoveAsset?: (asset: IAsset) => void;
    openAssignTags?: (asset: IAsset) => void;
    handleDeleteAsset?: (asset: IAsset) => void;
    handleTogglePrivacy?: (asset: IAsset) => Promise<void>;
  }>;
}

function AssetActionConnector({ hooks, dialogHandlersRef }: AssetActionConnectorProps) {
  // Get all mutations needed for dialogs
  const createFolder = hooks.useCreateFolder();
  const updateFolder = hooks.useUpdateFolder();
  const deleteFolder = hooks.useDeleteFolder();
  const moveFolder = hooks.useMoveFolder();
  const deleteAsset = hooks.useDeleteAsset();
  const togglePrivacy = hooks.useToggleAssetPrivacy();
  const moveAssetToFolder = hooks.useMoveAssetToFolder();
  const assignTags = hooks.useAssignTagsToAsset();
  const uploadAsset = hooks.useUploadAsset();
  const createTag = hooks.useCreateTag();
  const updateTag = hooks.useUpdateTag();
  const deleteTag = hooks.useDeleteTag();
  const bulkDeleteAssets = hooks.useBulkDeleteAssets();
  const bulkMoveAssets = hooks.useBulkMoveAssets();
  const bulkAssignTags = hooks.useBulkAssignTags();
  const folderTreeQuery = hooks.useFolderTree();
  const tagsQuery = hooks.useTags();

  // Get dialog handlers - this is inside the provider so useMediaLibrary works
  const dialogHandlers = useMediaLibraryDialogs({
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

  // Store dialog handlers in ref so parent component can use them
  useEffect(() => {
    dialogHandlersRef.current = {
      openPreview: dialogHandlers.openPreview,
      openMoveAsset: dialogHandlers.openMoveAsset,
      openAssignTags: dialogHandlers.openAssignTags,
      handleDeleteAsset: dialogHandlers.handleDeleteAsset,
      handleTogglePrivacy: dialogHandlers.handleTogglePrivacy,
    };
  }, [dialogHandlers, dialogHandlersRef]);

  return null; // This component doesn't render anything
}

// ============================================================================
// Internal: AssetsPageContentWrapper
// ============================================================================

interface AssetsPageContentWrapperProps {
  hooks: ReturnType<typeof createMediaLibraryHooks>;
  className?: string;
}

function AssetsPageContentWrapper({ hooks, className }: AssetsPageContentWrapperProps) {
  // Mutations
  const createFolder = hooks.useCreateFolder();
  const updateFolder = hooks.useUpdateFolder();
  const deleteFolder = hooks.useDeleteFolder();
  const moveFolder = hooks.useMoveFolder();
  const deleteAsset = hooks.useDeleteAsset();
  const togglePrivacy = hooks.useToggleAssetPrivacy();
  const moveAssetToFolder = hooks.useMoveAssetToFolder();
  const assignTags = hooks.useAssignTagsToAsset();
  const uploadAsset = hooks.useUploadAsset();
  const createTag = hooks.useCreateTag();
  const updateTag = hooks.useUpdateTag();
  const deleteTag = hooks.useDeleteTag();
  const bulkDeleteAssets = hooks.useBulkDeleteAssets();
  const bulkMoveAssets = hooks.useBulkMoveAssets();
  const bulkAssignTags = hooks.useBulkAssignTags();

  // Queries for dialogs
  const folderTreeQuery = hooks.useFolderTree();
  const tagsQuery = hooks.useTags();

  return (
    <AssetsPageContent
      createFolder={createFolder}
      updateFolder={updateFolder}
      deleteFolder={deleteFolder}
      moveFolder={moveFolder}
      deleteAsset={deleteAsset}
      togglePrivacy={togglePrivacy}
      moveAssetToFolder={moveAssetToFolder}
      assignTags={assignTags}
      uploadAsset={uploadAsset}
      createTag={createTag}
      updateTag={updateTag}
      deleteTag={deleteTag}
      bulkDeleteAssets={bulkDeleteAssets}
      bulkMoveAssets={bulkMoveAssets}
      bulkAssignTags={bulkAssignTags}
      folderTreeQuery={folderTreeQuery}
      tagsQuery={tagsQuery}
      className={className}
    />
  );
}
