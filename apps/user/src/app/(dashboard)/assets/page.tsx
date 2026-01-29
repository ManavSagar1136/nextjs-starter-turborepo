"use client";

import { useState, useCallback } from "react";
import {
  MediaLibrary,
  MediaLibraryProvider,
  useAssetQueryParams,
  type IAsset,
  type IFolderTreeItem,
} from "@buildbase/components/media-library";
import {
  CreateFolderDialog,
  EditFolderDialog,
  MoveFolderDialog,
  AssignTagsDialog,
  MoveAssetDialog,
  MediaUploadDialog,
  type UploadedFile,
} from "@buildbase/dialog-manager/media-library";
import { useDialogManager, COMMON_DIALOG_KEYS, type ConfirmationDialogProps } from "@buildbase/dialog-manager";

import { mediaLibraryApi } from "@/services/media-library";
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
} from "@/hooks/use-media-library";

// ============================================================================
// Dialog State Interface
// ============================================================================

interface DialogState {
  createFolder: { open: boolean; parentFolderId?: string | null; parentFolderName?: string | null };
  editFolder: { open: boolean; folder?: IFolderTreeItem & { description?: string | null } };
  moveFolder: { open: boolean; folder?: IFolderTreeItem };
  assignTags: { open: boolean; asset?: IAsset };
  moveAsset: { open: boolean; asset?: IAsset };
  upload: { open: boolean };
}

const initialDialogState: DialogState = {
  createFolder: { open: false },
  editFolder: { open: false },
  moveFolder: { open: false },
  assignTags: { open: false },
  moveAsset: { open: false },
  upload: { open: false },
};

// ============================================================================
// Assets Page Content (with provider context)
// ============================================================================

function AssetsPageContent() {
  const [dialogs, setDialogs] = useState<DialogState>(initialDialogState);
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { openDialog } = useDialogManager();

  // Get query params from context
  const queryParams = useAssetQueryParams();

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

  // Dialog handlers
  const openCreateFolder = useCallback((parentFolderId?: string | null, parentFolderName?: string | null) => {
    setDialogs(prev => ({
      ...prev,
      createFolder: { open: true, parentFolderId, parentFolderName },
    }));
  }, []);

  const openEditFolder = useCallback((folder: IFolderTreeItem) => {
    setDialogs(prev => ({
      ...prev,
      editFolder: { open: true, folder },
    }));
  }, []);

  const openMoveFolder = useCallback((folder: IFolderTreeItem) => {
    setDialogs(prev => ({
      ...prev,
      moveFolder: { open: true, folder },
    }));
  }, []);

  const openAssignTags = useCallback((asset: IAsset) => {
    setDialogs(prev => ({
      ...prev,
      assignTags: { open: true, asset },
    }));
  }, []);

  const openMoveAsset = useCallback((asset: IAsset) => {
    setDialogs(prev => ({
      ...prev,
      moveAsset: { open: true, asset },
    }));
  }, []);

  const openUpload = useCallback(() => {
    setUploadFiles([]);
    setDialogs(prev => ({
      ...prev,
      upload: { open: true },
    }));
  }, []);

  const closeDialog = useCallback((key: keyof DialogState) => {
    setDialogs(prev => ({
      ...prev,
      [key]: { ...initialDialogState[key], open: false },
    }));
  }, []);

  // Delete folder with confirmation
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

  // Delete asset with confirmation
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

  // Toggle privacy
  const handleTogglePrivacy = useCallback(
    async (asset: IAsset) => {
      await togglePrivacy.mutateAsync({
        assetId: asset.id,
        makePublic: !asset.isPublic,
      });
    },
    [togglePrivacy]
  );

  // Handle upload
  const handleUpload = useCallback(
    async (files: File[]) => {
      setIsUploading(true);

      // Initialize upload files
      const initialFiles: UploadedFile[] = files.map((file, i) => ({
        id: `upload-${Date.now()}-${i}`,
        file,
        status: "pending" as const,
        progress: 0,
      }));
      setUploadFiles(initialFiles);

      // Upload files sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const uploadId = initialFiles[i]!.id;

        try {
          // Update status to uploading
          setUploadFiles(prev =>
            prev.map(f => (f.id === uploadId ? { ...f, status: "uploading" as const, progress: 50 } : f))
          );

          // Upload file
          const result = await uploadAsset.mutateAsync({ file });

          // Update status to completed
          setUploadFiles(prev =>
            prev.map(f =>
              f.id === uploadId
                ? {
                    ...f,
                    status: "completed" as const,
                    progress: 100,
                    result: { id: result.id, url: result.url, path: "" },
                  }
                : f
            )
          );
        } catch (error) {
          // Update status to error
          setUploadFiles(prev =>
            prev.map(f =>
              f.id === uploadId
                ? {
                    ...f,
                    status: "error" as const,
                    error: error instanceof Error ? error.message : "Upload failed",
                  }
                : f
            )
          );
        }
      }

      setIsUploading(false);
    },
    [uploadAsset]
  );

  return (
    <>
      <MediaLibrary
        className="h-[calc(100vh-4rem)]"
        onUpload={openUpload}
        onCreateFolder={() => openCreateFolder()}
        onEditFolder={openEditFolder}
        onDeleteFolder={handleDeleteFolder}
        onMoveFolder={openMoveFolder}
      />

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={dialogs.createFolder.open}
        onOpenChange={open => !open && closeDialog("createFolder")}
        parentFolderId={dialogs.createFolder.parentFolderId}
        parentFolderName={dialogs.createFolder.parentFolderName}
        isLoading={createFolder.isPending}
        onCreateFolder={async data => {
          await createFolder.mutateAsync(data);
        }}
      />

      {/* Edit Folder Dialog */}
      {dialogs.editFolder.folder && (
        <EditFolderDialog
          open={dialogs.editFolder.open}
          onOpenChange={open => !open && closeDialog("editFolder")}
          folderId={dialogs.editFolder.folder.id}
          currentName={dialogs.editFolder.folder.name}
          currentDescription={dialogs.editFolder.folder.description}
          isLoading={updateFolder.isPending}
          onUpdateFolder={async data => {
            await updateFolder.mutateAsync({
              folderId: dialogs.editFolder.folder!.id,
              ...data,
            });
          }}
        />
      )}

      {/* Move Folder Dialog */}
      {dialogs.moveFolder.folder && (
        <MoveFolderDialogWrapper
          open={dialogs.moveFolder.open}
          onOpenChange={open => !open && closeDialog("moveFolder")}
          folder={dialogs.moveFolder.folder}
          onMoveFolder={async targetParentFolderId => {
            await moveFolder.mutateAsync({
              folderId: dialogs.moveFolder.folder!.id,
              targetParentFolderId,
            });
          }}
          isLoading={moveFolder.isPending}
        />
      )}

      {/* Assign Tags Dialog */}
      {dialogs.assignTags.asset && (
        <AssignTagsDialogWrapper
          open={dialogs.assignTags.open}
          onOpenChange={open => !open && closeDialog("assignTags")}
          asset={dialogs.assignTags.asset}
          onSaveTags={async tagIds => {
            await assignTags.mutateAsync({
              assetId: dialogs.assignTags.asset!.id,
              tagIds,
            });
          }}
          isLoading={assignTags.isPending}
        />
      )}

      {/* Move Asset Dialog */}
      {dialogs.moveAsset.asset && (
        <MoveAssetDialogWrapper
          open={dialogs.moveAsset.open}
          onOpenChange={open => !open && closeDialog("moveAsset")}
          asset={dialogs.moveAsset.asset}
          onMoveAsset={async targetFolderId => {
            await moveAssetToFolder.mutateAsync({
              assetId: dialogs.moveAsset.asset!.id,
              folderId: targetFolderId,
            });
          }}
          isLoading={moveAssetToFolder.isPending}
        />
      )}

      {/* Upload Dialog */}
      <MediaUploadDialog
        open={dialogs.upload.open}
        onOpenChange={open => !open && closeDialog("upload")}
        isUploading={isUploading}
        files={uploadFiles}
        onUpload={handleUpload}
        onComplete={() => closeDialog("upload")}
      />
    </>
  );
}

// ============================================================================
// Dialog Wrappers (fetch additional data)
// ============================================================================

function MoveFolderDialogWrapper({
  open,
  onOpenChange,
  folder,
  onMoveFolder,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: IFolderTreeItem;
  onMoveFolder: (targetParentFolderId: string | null) => Promise<void>;
  isLoading: boolean;
}) {
  const folderTreeQuery = useFolderTree(open);

  return (
    <MoveFolderDialog
      open={open}
      onOpenChange={onOpenChange}
      folderId={folder.id}
      folderName={folder.name}
      folderTree={folderTreeQuery.data || []}
      isLoadingTree={folderTreeQuery.isLoading}
      isLoading={isLoading}
      onMoveFolder={onMoveFolder}
    />
  );
}

function AssignTagsDialogWrapper({
  open,
  onOpenChange,
  asset,
  onSaveTags,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: IAsset;
  onSaveTags: (tagIds: string[]) => Promise<void>;
  isLoading: boolean;
}) {
  const tagsQuery = useTags(undefined, open);

  return (
    <AssignTagsDialog
      open={open}
      onOpenChange={onOpenChange}
      assetId={asset.id}
      currentTags={asset.tags || []}
      allTags={tagsQuery.data?.docs || []}
      isLoadingTags={tagsQuery.isLoading}
      tagsError={tagsQuery.error ? "Failed to load tags" : undefined}
      onRetryLoadTags={() => tagsQuery.refetch()}
      isLoading={isLoading}
      onSaveTags={onSaveTags}
    />
  );
}

function MoveAssetDialogWrapper({
  open,
  onOpenChange,
  asset,
  onMoveAsset,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: IAsset;
  onMoveAsset: (targetFolderId: string | null) => Promise<void>;
  isLoading: boolean;
}) {
  const folderTreeQuery = useFolderTree(open);

  return (
    <MoveAssetDialog
      open={open}
      onOpenChange={onOpenChange}
      assetId={asset.id}
      assetName={asset.filename || asset.name}
      currentFolderId={asset.folder?.id}
      currentFolderPath={asset.folder?.name || "Root (No Folder)"}
      folderTree={folderTreeQuery.data || []}
      isLoadingTree={folderTreeQuery.isLoading}
      isLoading={isLoading}
      onMoveAsset={onMoveAsset}
    />
  );
}

// ============================================================================
// Main Page (with data fetching)
// ============================================================================

export default function AssetsPage() {
  // Fetch data
  const [queryParams, setQueryParams] = useState<{
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

  // Callbacks for context
  const handleDeleteAsset = useCallback(async (asset: IAsset) => {
    // Handled in AssetsPageContent
  }, []);

  const handleTogglePrivacy = useCallback(async (asset: IAsset) => {
    // Handled in AssetsPageContent
  }, []);

  return (
    <MediaLibraryProvider
      api={mediaLibraryApi}
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
    >
      <AssetsPageContent />
    </MediaLibraryProvider>
  );
}
