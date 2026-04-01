"use client";

/**
 * Media Library Query Hooks Factory
 *
 * Creates TanStack Query hooks for the media library feature.
 * These hooks are shared between admin and user apps.
 *
 * @param api - The media library API implementation
 * @param workspaceId - The current workspace ID (optional, can be passed per hook)
 * @returns Object containing all media library query hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IMediaLibraryApi } from "../types";
import type { IAssetListParams, IFolderListParams } from "../types";

// ============================================================================
// Query Keys
// ============================================================================

export const mediaLibraryKeys = {
  all: (workspaceId?: string | null) => ["media-library", workspaceId] as const,
  assets: (workspaceId?: string | null) => [...mediaLibraryKeys.all(workspaceId), "assets"] as const,
  assetList: (workspaceId: string | null | undefined, params?: IAssetListParams) =>
    [...mediaLibraryKeys.assets(workspaceId), "list", params] as const,
  assetDetail: (workspaceId: string | null | undefined, id: string) =>
    [...mediaLibraryKeys.assets(workspaceId), "detail", id] as const,
  folders: (workspaceId?: string | null) => [...mediaLibraryKeys.all(workspaceId), "folders"] as const,
  folderTree: (workspaceId?: string | null) => [...mediaLibraryKeys.folders(workspaceId), "tree"] as const,
  folderList: (workspaceId: string | null | undefined, params?: IFolderListParams) =>
    [...mediaLibraryKeys.folders(workspaceId), "list", params] as const,
  folderDetail: (workspaceId: string | null | undefined, id: string) =>
    [...mediaLibraryKeys.folders(workspaceId), "detail", id] as const,
  tags: (workspaceId?: string | null) => [...mediaLibraryKeys.all(workspaceId), "tags"] as const,
  tagList: (workspaceId: string | null | undefined, params?: { search?: string }) =>
    [...mediaLibraryKeys.tags(workspaceId), "list", params] as const,
  tagDetail: (workspaceId: string | null | undefined, id: string) =>
    [...mediaLibraryKeys.tags(workspaceId), "detail", id] as const,
};

// ============================================================================
// Hook Factory
// ============================================================================

export function createMediaLibraryHooks(api: IMediaLibraryApi, defaultWorkspaceId?: string | null) {
  // ============================================================================
  // Asset Hooks
  // ============================================================================

  function useAssets(params?: IAssetListParams, enabled = true, workspaceId?: string | null) {
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useQuery({
      queryKey: mediaLibraryKeys.assetList(effectiveWorkspaceId, params),
      queryFn: () => api.getAssets(params),
      enabled: enabled && !!effectiveWorkspaceId,
      staleTime: 1000 * 60 * 2, // 2 minutes
    });
  }

  function useAsset(assetId: string | null, enabled = true, workspaceId?: string | null) {
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useQuery({
      queryKey: mediaLibraryKeys.assetDetail(effectiveWorkspaceId, assetId || ""),
      queryFn: () => api.getAsset(assetId!),
      enabled: enabled && !!assetId && !!effectiveWorkspaceId,
      staleTime: 1000 * 60 * 2,
    });
  }

  function useUpdateAsset(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: ({
        assetId,
        ...params
      }: {
        assetId: string;
        filename?: string;
        folderId?: string | null;
        tags?: string[];
        metadata?: Record<string, unknown>;
      }) => api.updateAsset(assetId, params),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets(effectiveWorkspaceId) });
      },
    });
  }

  function useDeleteAsset(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: ({ assetId, force }: { assetId: string; force?: boolean }) => api.deleteAsset(assetId, force),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets(effectiveWorkspaceId) });
      },
    });
  }

  function useToggleAssetPrivacy(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: ({ assetId, makePublic }: { assetId: string; makePublic: boolean }) =>
        api.toggleAssetPrivacy(assetId, makePublic),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets(effectiveWorkspaceId) });
      },
    });
  }

  function useDuplicateAsset(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: (assetId: string) => api.duplicateAsset(assetId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets(effectiveWorkspaceId) });
      },
    });
  }

  function useMoveAssetToFolder(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: ({ assetId, folderId }: { assetId: string; folderId: string | null }) =>
        api.moveAssetToFolder(assetId, folderId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets(effectiveWorkspaceId) });
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders(effectiveWorkspaceId) });
      },
    });
  }

  function useAssignTagsToAsset(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: ({ assetId, tagIds }: { assetId: string; tagIds: string[] }) =>
        api.assignTagsToAsset(assetId, tagIds),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets(effectiveWorkspaceId) });
      },
    });
  }

  // ============================================================================
  // Folder Hooks
  // ============================================================================

  function useFolderTree(enabled = true, workspaceId?: string | null) {
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useQuery({
      queryKey: mediaLibraryKeys.folderTree(effectiveWorkspaceId),
      queryFn: () => api.getFolderTree(),
      enabled: enabled && !!effectiveWorkspaceId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  }

  function useFolders(params?: IFolderListParams, enabled = true, workspaceId?: string | null) {
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useQuery({
      queryKey: mediaLibraryKeys.folderList(effectiveWorkspaceId, params),
      queryFn: () => api.getFolders(params),
      enabled: enabled && !!effectiveWorkspaceId,
      staleTime: 1000 * 60 * 2,
    });
  }

  function useFolder(folderId: string | null, enabled = true, workspaceId?: string | null) {
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useQuery({
      queryKey: mediaLibraryKeys.folderDetail(effectiveWorkspaceId, folderId || ""),
      queryFn: () => api.getFolder(folderId!),
      enabled: enabled && !!folderId && !!effectiveWorkspaceId,
      staleTime: 1000 * 60 * 2,
    });
  }

  function useCreateFolder(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: (params: { name: string; parentFolderId?: string | null; description?: string }) =>
        api.createFolder(params),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders(effectiveWorkspaceId) });
      },
    });
  }

  function useUpdateFolder(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: ({ folderId, ...params }: { folderId: string; name?: string; description?: string }) =>
        api.updateFolder(folderId, params),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders(effectiveWorkspaceId) });
      },
    });
  }

  function useDeleteFolder(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: ({ folderId, recursive }: { folderId: string; recursive?: boolean }) =>
        api.deleteFolder(folderId, recursive),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders(effectiveWorkspaceId) });
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets(effectiveWorkspaceId) });
      },
    });
  }

  function useMoveFolder(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: ({ folderId, targetParentFolderId }: { folderId: string; targetParentFolderId: string | null }) =>
        api.moveFolder(folderId, targetParentFolderId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders(effectiveWorkspaceId) });
      },
    });
  }

  // ============================================================================
  // Tag Hooks
  // ============================================================================

  function useTags(params?: { search?: string }, enabled = true, workspaceId?: string | null) {
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useQuery({
      queryKey: mediaLibraryKeys.tagList(effectiveWorkspaceId, params),
      queryFn: () => api.getTags(params),
      enabled: enabled && !!effectiveWorkspaceId,
      staleTime: 1000 * 60 * 5,
    });
  }

  function useCreateTag(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: (params: { name: string; color?: string }) => api.createTag(params),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.tags(effectiveWorkspaceId) });
      },
    });
  }

  function useUpdateTag(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: ({ tagId, ...params }: { tagId: string; name?: string; color?: string }) =>
        api.updateTag(tagId, params),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.tags(effectiveWorkspaceId) });
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets(effectiveWorkspaceId) });
      },
    });
  }

  function useDeleteTag(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: (tagId: string) => api.deleteTag(tagId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.tags(effectiveWorkspaceId) });
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets(effectiveWorkspaceId) });
      },
    });
  }

  // ============================================================================
  // Upload Hooks
  // ============================================================================

  function useUploadAsset(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: ({ file, options }: { file: File; options?: { folderId?: string | null; makePublic?: boolean } }) => {
        if (!api.uploadAsset) {
          throw new Error("uploadAsset is not implemented in the API");
        }
        return api.uploadAsset(file, options);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets(effectiveWorkspaceId) });
      },
    });
  }

  // ============================================================================
  // Bulk Operations Hooks
  // ============================================================================

  function useBulkDeleteAssets(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: (assetIds: string[]) => {
        if (!api.bulkDeleteAssets) {
          throw new Error("bulkDeleteAssets is not implemented in the API");
        }
        return api.bulkDeleteAssets(assetIds);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets(effectiveWorkspaceId) });
      },
    });
  }

  function useBulkMoveAssets(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: ({ assetIds, folderId }: { assetIds: string[]; folderId: string | null }) => {
        if (!api.bulkMoveAssets) {
          throw new Error("bulkMoveAssets is not implemented in the API");
        }
        return api.bulkMoveAssets(assetIds, folderId);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets(effectiveWorkspaceId) });
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders(effectiveWorkspaceId) });
      },
    });
  }

  function useBulkAssignTags(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: ({ assetIds, tagIds }: { assetIds: string[]; tagIds: string[] }) => {
        if (!api.bulkAssignTags) {
          throw new Error("bulkAssignTags is not implemented in the API");
        }
        return api.bulkAssignTags(assetIds, tagIds);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets(effectiveWorkspaceId) });
      },
    });
  }

  function useBulkRemoveTags(workspaceId?: string | null) {
    const queryClient = useQueryClient();
    const effectiveWorkspaceId = workspaceId ?? defaultWorkspaceId ?? null;

    return useMutation({
      mutationFn: ({ assetIds, tagIds }: { assetIds: string[]; tagIds: string[] }) => {
        if (!api.bulkRemoveTags) {
          throw new Error("bulkRemoveTags is not implemented in the API");
        }
        return api.bulkRemoveTags(assetIds, tagIds);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets(effectiveWorkspaceId) });
      },
    });
  }

  return {
    // Asset hooks
    useAssets,
    useAsset,
    useUpdateAsset,
    useDeleteAsset,
    useToggleAssetPrivacy,
    useDuplicateAsset,
    useMoveAssetToFolder,
    useAssignTagsToAsset,

    // Folder hooks
    useFolderTree,
    useFolders,
    useFolder,
    useCreateFolder,
    useUpdateFolder,
    useDeleteFolder,
    useMoveFolder,

    // Tag hooks
    useTags,
    useCreateTag,
    useUpdateTag,
    useDeleteTag,

    // Upload hooks
    useUploadAsset,

    // Bulk operation hooks
    useBulkDeleteAssets,
    useBulkMoveAssets,
    useBulkAssignTags,
    useBulkRemoveTags,
  };
}
