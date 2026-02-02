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

import { useState, useCallback } from "react";
import { MediaLibraryProvider } from "../context";
import { AssetsQuerySync } from "./AssetsQuerySync";
import { AssetsPageContent } from "./AssetsPageContent";
import { createMediaLibraryHooks } from "../hooks/use-media-library-queries";
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
  // Create hooks using the shared factory
  const hooks = createMediaLibraryHooks(api);

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
  }>({ $page: 1, $limit: 20 });

  // Assets query - will refetch when queryParams change
  const assetsQuery = hooks.useAssets(queryParams);

  // Mutations for provider handlers
  const deleteAssetMutation = hooks.useDeleteAsset();
  const togglePrivacyMutation = hooks.useToggleAssetPrivacy();
  const moveAssetToFolderMutation = hooks.useMoveAssetToFolder();
  const assignTagsMutation = hooks.useAssignTagsToAsset();

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

  const handlePreviewAsset = useCallback((asset: IAsset) => {
    // Preview is handled by AssetsPageContent component
    // This is just a placeholder for the provider
  }, []);

  const handleDownloadAsset = useCallback((asset: IAsset) => {
    window.open(asset.url, "_blank");
  }, []);

  const handleMoveAsset = useCallback((asset: IAsset) => {
    // Move is handled by AssetsPageContent component
    // This is just a placeholder for the provider
  }, []);

  const handleAssignTags = useCallback((asset: IAsset) => {
    // Assign tags is handled by AssetsPageContent component
    // This is just a placeholder for the provider
  }, []);

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
      initialFolderId={initialFolderId}
    >
      <AssetsQuerySync setQueryParams={setQueryParams} />
      <AssetsPageContentWrapper hooks={hooks} className={className} />
    </MediaLibraryProvider>
  );
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
