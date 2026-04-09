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
import { MediaLibraryProvider } from "../context";
import { AssetsQuerySync } from "./AssetsQuerySync";
import { AssetsPageContent } from "./AssetsPageContent";
import { createMediaLibraryHooks } from "../hooks/use-media-library-queries";
import { useMediaLibraryDialogs } from "../hooks/use-media-library-dialogs";
import type { IAsset, IMediaLibraryApi, MediaLibraryPermissions } from "../types";
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
  /** Optional workspace ID */
  workspaceId?: string | null;
  /**
   * Role-based write permissions. Defaults to fully permissive.
   * Pass `{ canWrite: false }` for read-only viewers.
   *
   * @example
   * const { isAdmin, isEditor } = useSDKAuth();
   * <AssetsPage permissions={{ canWrite: isAdmin || isEditor }} />
   */
  permissions?: MediaLibraryPermissions;
}

// ============================================================================
// Component
// ============================================================================

export function AssetsPage({
  api,
  initialFolderId = null,
  className,
  workspaceId = null,
  permissions,
}: AssetsPageProps) {
  // Create hooks using the shared factory - memoize to prevent recreation on every render
  // Pass workspaceId as default so all hooks use it
  const hooks = useMemo(() => createMediaLibraryHooks(api, workspaceId), [api, workspaceId]);

  // Fetch data - workspaceId is already set as default, but can be overridden per hook if needed
  const folderTreeQuery = hooks.useFolderTree(true, workspaceId);
  const tagsQuery = hooks.useTags({ search: undefined }, true, workspaceId);

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
  const assetsQuery = hooks.useAssets(queryParams, true, workspaceId);

  // Mutations for provider handlers - workspaceId is already set as default
  const deleteAssetMutation = hooks.useDeleteAsset(workspaceId);
  const togglePrivacyMutation = hooks.useToggleAssetPrivacy(workspaceId);
  const duplicateAssetMutation = hooks.useDuplicateAsset(workspaceId);

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
      config={permissions ? { permissions } : undefined}
    >
      <AssetsQuerySync setQueryParams={setQueryParams} />
      <AssetActionConnector hooks={hooks} dialogHandlersRef={dialogHandlersRef} workspaceId={workspaceId} />
      <AssetsPageContentWrapper hooks={hooks} className={className} workspaceId={workspaceId} />
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
  workspaceId: string | null;
}

function AssetActionConnector({ hooks, dialogHandlersRef, workspaceId }: AssetActionConnectorProps) {
  // Get all mutations needed for dialogs
  const createFolder = hooks.useCreateFolder(workspaceId);
  const updateFolder = hooks.useUpdateFolder(workspaceId);
  const deleteFolder = hooks.useDeleteFolder(workspaceId);
  const moveFolder = hooks.useMoveFolder(workspaceId);
  const deleteAsset = hooks.useDeleteAsset(workspaceId);
  const togglePrivacy = hooks.useToggleAssetPrivacy(workspaceId);
  const moveAssetToFolder = hooks.useMoveAssetToFolder();
  const assignTags = hooks.useAssignTagsToAsset(workspaceId);
  const uploadAsset = hooks.useUploadAsset(workspaceId);
  const createTag = hooks.useCreateTag(workspaceId);
  const updateTag = hooks.useUpdateTag(workspaceId);
  const deleteTag = hooks.useDeleteTag(workspaceId);
  const bulkDeleteAssets = hooks.useBulkDeleteAssets(workspaceId);
  const bulkMoveAssets = hooks.useBulkMoveAssets(workspaceId);
  const bulkAssignTags = hooks.useBulkAssignTags(workspaceId);
  const folderTreeQuery = hooks.useFolderTree(true, workspaceId);
  const tagsQuery = hooks.useTags({ search: undefined }, true, workspaceId);

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
  workspaceId: string | null;
}

function AssetsPageContentWrapper({ hooks, className, workspaceId }: AssetsPageContentWrapperProps) {
  // Mutations
  const createFolder = hooks.useCreateFolder(workspaceId);
  const updateFolder = hooks.useUpdateFolder(workspaceId);
  const deleteFolder = hooks.useDeleteFolder(workspaceId);
  const moveFolder = hooks.useMoveFolder(workspaceId);
  const deleteAsset = hooks.useDeleteAsset(workspaceId);
  const togglePrivacy = hooks.useToggleAssetPrivacy(workspaceId);
  const moveAssetToFolder = hooks.useMoveAssetToFolder(workspaceId);
  const assignTags = hooks.useAssignTagsToAsset(workspaceId);
  const uploadAsset = hooks.useUploadAsset(workspaceId);
  const createTag = hooks.useCreateTag(workspaceId);
  const updateTag = hooks.useUpdateTag(workspaceId);
  const deleteTag = hooks.useDeleteTag(workspaceId);
  const bulkDeleteAssets = hooks.useBulkDeleteAssets(workspaceId);
  const bulkMoveAssets = hooks.useBulkMoveAssets(workspaceId);
  const bulkAssignTags = hooks.useBulkAssignTags(workspaceId);

  // Queries for dialogs
  const folderTreeQuery = hooks.useFolderTree(true, workspaceId);
  const tagsQuery = hooks.useTags({ search: undefined }, true, workspaceId);

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
