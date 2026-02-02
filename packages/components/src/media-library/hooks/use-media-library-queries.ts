"use client";

/**
 * Media Library Query Hooks Factory
 *
 * Creates TanStack Query hooks for the media library feature.
 * These hooks are shared between admin and user apps.
 *
 * @param api - The media library API implementation
 * @returns Object containing all media library query hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IMediaLibraryApi } from "../types";
import type { IAssetListParams, IFolderListParams } from "../types";

// ============================================================================
// Query Keys
// ============================================================================

export const mediaLibraryKeys = {
  all: ["media-library"] as const,
  assets: () => [...mediaLibraryKeys.all, "assets"] as const,
  assetList: (params?: IAssetListParams) => [...mediaLibraryKeys.assets(), "list", params] as const,
  assetDetail: (id: string) => [...mediaLibraryKeys.assets(), "detail", id] as const,
  folders: () => [...mediaLibraryKeys.all, "folders"] as const,
  folderTree: () => [...mediaLibraryKeys.folders(), "tree"] as const,
  folderList: (params?: IFolderListParams) => [...mediaLibraryKeys.folders(), "list", params] as const,
  folderDetail: (id: string) => [...mediaLibraryKeys.folders(), "detail", id] as const,
  tags: () => [...mediaLibraryKeys.all, "tags"] as const,
  tagList: (params?: { search?: string }) => [...mediaLibraryKeys.tags(), "list", params] as const,
  tagDetail: (id: string) => [...mediaLibraryKeys.tags(), "detail", id] as const,
};

// ============================================================================
// Hook Factory
// ============================================================================

export function createMediaLibraryHooks(api: IMediaLibraryApi) {
  // ============================================================================
  // Asset Hooks
  // ============================================================================

  function useAssets(params?: IAssetListParams, enabled = true) {
    return useQuery({
      queryKey: mediaLibraryKeys.assetList(params),
      queryFn: () => api.getAssets(params),
      enabled,
      staleTime: 1000 * 60 * 2, // 2 minutes
    });
  }

  function useAsset(assetId: string | null, enabled = true) {
    return useQuery({
      queryKey: mediaLibraryKeys.assetDetail(assetId || ""),
      queryFn: () => api.getAsset(assetId!),
      enabled: enabled && !!assetId,
      staleTime: 1000 * 60 * 2,
    });
  }

  function useUpdateAsset() {
    const queryClient = useQueryClient();

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
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
      },
    });
  }

  function useDeleteAsset() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ assetId, force }: { assetId: string; force?: boolean }) => api.deleteAsset(assetId, force),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
      },
    });
  }

  function useToggleAssetPrivacy() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ assetId, makePublic }: { assetId: string; makePublic: boolean }) =>
        api.toggleAssetPrivacy(assetId, makePublic),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
      },
    });
  }

  function useDuplicateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (assetId: string) => api.duplicateAsset(assetId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
      },
    });
  }

  function useMoveAssetToFolder() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ assetId, folderId }: { assetId: string; folderId: string | null }) =>
        api.moveAssetToFolder(assetId, folderId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders() });
      },
    });
  }

  function useAssignTagsToAsset() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ assetId, tagIds }: { assetId: string; tagIds: string[] }) =>
        api.assignTagsToAsset(assetId, tagIds),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
      },
    });
  }

  // ============================================================================
  // Folder Hooks
  // ============================================================================

  function useFolderTree(enabled = true) {
    return useQuery({
      queryKey: mediaLibraryKeys.folderTree(),
      queryFn: () => api.getFolderTree(),
      enabled,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  }

  function useFolders(params?: IFolderListParams, enabled = true) {
    return useQuery({
      queryKey: mediaLibraryKeys.folderList(params),
      queryFn: () => api.getFolders(params),
      enabled,
      staleTime: 1000 * 60 * 2,
    });
  }

  function useFolder(folderId: string | null, enabled = true) {
    return useQuery({
      queryKey: mediaLibraryKeys.folderDetail(folderId || ""),
      queryFn: () => api.getFolder(folderId!),
      enabled: enabled && !!folderId,
      staleTime: 1000 * 60 * 2,
    });
  }

  function useCreateFolder() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (params: { name: string; parentFolderId?: string | null; description?: string }) =>
        api.createFolder(params),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders() });
      },
    });
  }

  function useUpdateFolder() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ folderId, ...params }: { folderId: string; name?: string; description?: string }) =>
        api.updateFolder(folderId, params),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders() });
      },
    });
  }

  function useDeleteFolder() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ folderId, recursive }: { folderId: string; recursive?: boolean }) =>
        api.deleteFolder(folderId, recursive),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders() });
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
      },
    });
  }

  function useMoveFolder() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ folderId, targetParentFolderId }: { folderId: string; targetParentFolderId: string | null }) =>
        api.moveFolder(folderId, targetParentFolderId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders() });
      },
    });
  }

  // ============================================================================
  // Tag Hooks
  // ============================================================================

  function useTags(params?: { search?: string }, enabled = true) {
    return useQuery({
      queryKey: mediaLibraryKeys.tagList(params),
      queryFn: () => api.getTags(params),
      enabled,
      staleTime: 1000 * 60 * 5,
    });
  }

  function useCreateTag() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (params: { name: string; color?: string }) => api.createTag(params),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.tags() });
      },
    });
  }

  function useUpdateTag() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ tagId, ...params }: { tagId: string; name?: string; color?: string }) =>
        api.updateTag(tagId, params),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.tags() });
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
      },
    });
  }

  function useDeleteTag() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (tagId: string) => api.deleteTag(tagId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.tags() });
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
      },
    });
  }

  // ============================================================================
  // Upload Hooks
  // ============================================================================

  function useUploadAsset() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ file, options }: { file: File; options?: { folderId?: string | null; makePublic?: boolean } }) => {
        if (!api.uploadAsset) {
          throw new Error("uploadAsset is not implemented in the API");
        }
        return api.uploadAsset(file, options);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
      },
    });
  }

  // ============================================================================
  // Bulk Operations Hooks
  // ============================================================================

  function useBulkDeleteAssets() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (assetIds: string[]) => {
        if (!api.bulkDeleteAssets) {
          throw new Error("bulkDeleteAssets is not implemented in the API");
        }
        return api.bulkDeleteAssets(assetIds);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
      },
    });
  }

  function useBulkMoveAssets() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ assetIds, folderId }: { assetIds: string[]; folderId: string | null }) => {
        if (!api.bulkMoveAssets) {
          throw new Error("bulkMoveAssets is not implemented in the API");
        }
        return api.bulkMoveAssets(assetIds, folderId);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders() });
      },
    });
  }

  function useBulkAssignTags() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ assetIds, tagIds }: { assetIds: string[]; tagIds: string[] }) => {
        if (!api.bulkAssignTags) {
          throw new Error("bulkAssignTags is not implemented in the API");
        }
        return api.bulkAssignTags(assetIds, tagIds);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
      },
    });
  }

  function useBulkRemoveTags() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ assetIds, tagIds }: { assetIds: string[]; tagIds: string[] }) => {
        if (!api.bulkRemoveTags) {
          throw new Error("bulkRemoveTags is not implemented in the API");
        }
        return api.bulkRemoveTags(assetIds, tagIds);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
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
