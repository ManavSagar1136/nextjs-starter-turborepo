"use client";

/**
 * Media Library Hooks
 *
 * TanStack Query hooks for the media library feature.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/services";
import type { IAssetListParams, IFolderListParams, IAsset, ITag } from "@buildbase/components/media-library";

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
// Asset Hooks
// ============================================================================

export function useAssets(params?: IAssetListParams, enabled = true) {
  return useQuery({
    queryKey: mediaLibraryKeys.assetList(params),
    queryFn: () => API.mediaLibrary.getAssets(params),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useAsset(assetId: string | null, enabled = true) {
  return useQuery({
    queryKey: mediaLibraryKeys.assetDetail(assetId || ""),
    queryFn: () => API.mediaLibrary.getAsset(assetId!),
    enabled: enabled && !!assetId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateAsset() {
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
    }) => API.mediaLibrary.updateAsset(assetId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, force }: { assetId: string; force?: boolean }) =>
      API.mediaLibrary.deleteAsset(assetId, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
    },
  });
}

export function useToggleAssetPrivacy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, makePublic }: { assetId: string; makePublic: boolean }) =>
      API.mediaLibrary.toggleAssetPrivacy(assetId, makePublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
    },
  });
}

export function useDuplicateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetId: string) => API.mediaLibrary.duplicateAsset(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
    },
  });
}

export function useMoveAssetToFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, folderId }: { assetId: string; folderId: string | null }) =>
      API.mediaLibrary.moveAssetToFolder(assetId, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders() });
    },
  });
}

export function useAssignTagsToAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, tagIds }: { assetId: string; tagIds: string[] }) =>
      API.mediaLibrary.assignTagsToAsset(assetId, tagIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
    },
  });
}

// ============================================================================
// Folder Hooks
// ============================================================================

export function useFolderTree(enabled = true) {
  return useQuery({
    queryKey: mediaLibraryKeys.folderTree(),
    queryFn: () => API.mediaLibrary.getFolderTree(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useFolders(params?: IFolderListParams, enabled = true) {
  return useQuery({
    queryKey: mediaLibraryKeys.folderList(params),
    queryFn: () => API.mediaLibrary.getFolders(params),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export function useFolder(folderId: string | null, enabled = true) {
  return useQuery({
    queryKey: mediaLibraryKeys.folderDetail(folderId || ""),
    queryFn: () => API.mediaLibrary.getFolder(folderId!),
    enabled: enabled && !!folderId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { name: string; parentFolderId?: string | null; description?: string }) =>
      API.mediaLibrary.createFolder(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders() });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, ...params }: { folderId: string; name?: string; description?: string }) =>
      API.mediaLibrary.updateFolder(folderId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders() });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, recursive }: { folderId: string; recursive?: boolean }) =>
      API.mediaLibrary.deleteFolder(folderId, recursive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders() });
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
    },
  });
}

export function useMoveFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, targetParentFolderId }: { folderId: string; targetParentFolderId: string | null }) =>
      API.mediaLibrary.moveFolder(folderId, targetParentFolderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders() });
    },
  });
}

// ============================================================================
// Tag Hooks
// ============================================================================

export function useTags(params?: { search?: string }, enabled = true) {
  return useQuery({
    queryKey: mediaLibraryKeys.tagList(params),
    queryFn: () => API.mediaLibrary.getTags(params),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { name: string; color?: string }) => API.mediaLibrary.createTag(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.tags() });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tagId, ...params }: { tagId: string; name?: string; color?: string }) =>
      API.mediaLibrary.updateTag(tagId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.tags() });
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => API.mediaLibrary.deleteTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.tags() });
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
    },
  });
}

// ============================================================================
// Upload Hooks
// ============================================================================

export function useUploadAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, options }: { file: File; options?: { folderId?: string | null; makePublic?: boolean } }) =>
      API.mediaLibrary.uploadAsset(file, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
    },
  });
}

// ============================================================================
// Bulk Operations Hooks
// ============================================================================

export function useBulkDeleteAssets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetIds: string[]) => API.mediaLibrary.bulkDeleteAssets(assetIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
    },
  });
}

export function useBulkMoveAssets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetIds, folderId }: { assetIds: string[]; folderId: string | null }) =>
      API.mediaLibrary.bulkMoveAssets(assetIds, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.folders() });
    },
  });
}

export function useBulkAssignTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetIds, tagIds }: { assetIds: string[]; tagIds: string[] }) =>
      API.mediaLibrary.bulkAssignTags(assetIds, tagIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
    },
  });
}

export function useBulkRemoveTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetIds, tagIds }: { assetIds: string[]; tagIds: string[] }) =>
      API.mediaLibrary.bulkRemoveTags(assetIds, tagIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaLibraryKeys.assets() });
    },
  });
}
