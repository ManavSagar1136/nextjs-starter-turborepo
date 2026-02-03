"use client";

/**
 * AssetsQuerySync Component
 *
 * Syncs MediaLibrary context state to query params state.
 * When folder/tag/search changes in context, this component updates
 * the query params, which triggers React Query to refetch assets.
 *
 * This component should be placed inside MediaLibraryProvider.
 */

import { useEffect } from "react";
import { useMediaLibrary } from "../context";

// ============================================================================
// Types
// ============================================================================

export interface AssetsQueryParams {
  folderId?: string | null;
  tagIds?: string[];
  search?: string;
  contentType?: string[];
  $page?: number;
  $limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface AssetsQuerySyncProps {
  setQueryParams: React.Dispatch<React.SetStateAction<AssetsQueryParams>>;
}

// ============================================================================
// Component
// ============================================================================

export function AssetsQuerySync({ setQueryParams }: AssetsQuerySyncProps) {
  const { selectedFolderId, selectedTagIds, selectedMimeTypes, debouncedSearchQuery, currentPage, sortBy, sortOrder } =
    useMediaLibrary();

  // Update query params when context state changes - this triggers React Query refetch
  useEffect(() => {
    setQueryParams({
      folderId: selectedFolderId !== null ? selectedFolderId : undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      contentType: selectedMimeTypes.length > 0 ? selectedMimeTypes : undefined,
      search: debouncedSearchQuery || undefined,
      sortBy,
      sortOrder,
      $page: currentPage,
      $limit: 10,
    });
  }, [
    selectedFolderId,
    selectedTagIds,
    selectedMimeTypes,
    debouncedSearchQuery,
    currentPage,
    sortBy,
    sortOrder,
    setQueryParams,
  ]);

  return null;
}
