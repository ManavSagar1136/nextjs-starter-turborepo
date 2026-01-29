"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_MEDIA_LIBRARY_CONFIG,
  type IAsset,
  type IAssetAction,
  type IAssetActionPayload,
  type IAssetListParams,
  type IFolder,
  type IFolderTreeItem,
  type IMediaLibraryApi,
  type IMediaLibraryConfig,
  type IResolvedMediaLibraryConfig,
  type IPaginationResponse,
  type ITag,
  type ViewMode,
} from "./types";

// ============================================================================
// Context Types
// ============================================================================

interface MediaLibraryState {
  // Selection state
  selectedFolderId: string | null;
  selectedTagIds: string[];
  selectedMimeTypes: string[];
  searchQuery: string;
  viewMode: ViewMode;
  currentPage: number;

  // UI state
  isUploadDialogOpen: boolean;
  isFolderSidebarOpen: boolean;

  // Active operations
  activeAssetAction: { action: IAssetAction; asset: IAsset } | null;
}

interface MediaLibraryContextValue extends MediaLibraryState {
  // Configuration
  config: IResolvedMediaLibraryConfig;
  api: IMediaLibraryApi;

  // Data (passed from parent)
  assets: IPaginationResponse<IAsset> | null;
  folderTree: IFolderTreeItem[];
  tags: ITag[];
  isLoadingAssets: boolean;
  isLoadingFolders: boolean;
  isLoadingTags: boolean;

  // Computed
  currentFolderPath: Array<{ id: string; name: string }>;
  hasActiveFilters: boolean;
  activeFilterCount: number;

  // Actions - Selection
  setSelectedFolderId: (folderId: string | null) => void;
  setSelectedTagIds: (tagIds: string[]) => void;
  toggleTagId: (tagId: string) => void;
  setSelectedMimeTypes: (mimeTypes: string[]) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setCurrentPage: (page: number) => void;
  clearFilters: () => void;

  // Actions - UI
  openUploadDialog: () => void;
  closeUploadDialog: () => void;
  toggleFolderSidebar: () => void;

  // Actions - Asset operations
  onAssetAction: (payload: IAssetActionPayload) => void;
  getOngoingAssetAction: (asset: IAsset) => { action: IAssetAction | null };

  // Refresh data
  refreshAssets: () => void;
  refreshFolders: () => void;
  refreshTags: () => void;
}

// ============================================================================
// Context
// ============================================================================

const MediaLibraryContext = createContext<MediaLibraryContextValue | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function useMediaLibrary() {
  const context = useContext(MediaLibraryContext);
  if (!context) {
    throw new Error("useMediaLibrary must be used within a MediaLibraryProvider");
  }
  return context;
}

// ============================================================================
// Provider Props
// ============================================================================

interface MediaLibraryProviderProps {
  children: ReactNode;

  // API implementation
  api: IMediaLibraryApi;

  // Configuration
  config?: IMediaLibraryConfig;

  // Data (from TanStack Query or other state management)
  assets: IPaginationResponse<IAsset> | null;
  folderTree: IFolderTreeItem[];
  tags: ITag[];
  isLoadingAssets?: boolean;
  isLoadingFolders?: boolean;
  isLoadingTags?: boolean;

  // Refresh callbacks
  onRefreshAssets?: () => void;
  onRefreshFolders?: () => void;
  onRefreshTags?: () => void;

  // Asset action handlers (optional - for dialog management)
  onDeleteAsset?: (asset: IAsset) => void;
  onAssignTags?: (asset: IAsset) => void;
  onMoveAsset?: (asset: IAsset) => void;
  onTogglePrivacy?: (asset: IAsset) => Promise<void>;
  onPreviewAsset?: (asset: IAsset) => void;
  onDownloadAsset?: (asset: IAsset) => void;
  onEditAsset?: (asset: IAsset) => void;

  // Initial state
  initialFolderId?: string | null;
  initialViewMode?: ViewMode;
}

// ============================================================================
// Provider
// ============================================================================

export function MediaLibraryProvider({
  children,
  api,
  config: configOverrides,
  assets,
  folderTree,
  tags,
  isLoadingAssets = false,
  isLoadingFolders = false,
  isLoadingTags = false,
  onRefreshAssets,
  onRefreshFolders,
  onRefreshTags,
  onDeleteAsset,
  onAssignTags,
  onMoveAsset,
  onTogglePrivacy,
  onPreviewAsset,
  onDownloadAsset,
  onEditAsset,
  initialFolderId = null,
  initialViewMode,
}: MediaLibraryProviderProps) {
  // Merge config with defaults
  const config = useMemo(
    () => ({
      ...DEFAULT_MEDIA_LIBRARY_CONFIG,
      ...configOverrides,
      labels: {
        ...DEFAULT_MEDIA_LIBRARY_CONFIG.labels,
        ...configOverrides?.labels,
      },
    }),
    [configOverrides]
  );

  // State
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolderId);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedMimeTypes, setSelectedMimeTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode ?? config.defaultViewMode);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isFolderSidebarOpen, setIsFolderSidebarOpen] = useState(false);
  const [activeAssetAction, setActiveAssetAction] = useState<{
    action: IAssetAction;
    asset: IAsset;
  } | null>(null);

  // Computed: current folder path for breadcrumbs
  const currentFolderPath = useMemo(() => {
    if (!selectedFolderId || !folderTree.length) return [];

    const findPath = (
      folders: IFolderTreeItem[],
      targetId: string,
      path: Array<{ id: string; name: string }> = []
    ): Array<{ id: string; name: string }> | null => {
      for (const folder of folders) {
        const newPath = [...path, { id: folder.id, name: folder.name }];
        if (folder.id === targetId) return newPath;
        if (folder.children) {
          const found = findPath(folder.children, targetId, newPath);
          if (found) return found;
        }
      }
      return null;
    };

    return findPath(folderTree, selectedFolderId) || [];
  }, [selectedFolderId, folderTree]);

  // Computed: filter state
  const hasActiveFilters = useMemo(
    () =>
      (config.enableFolders && selectedFolderId !== null) ||
      (config.enableTags && selectedTagIds.length > 0) ||
      selectedMimeTypes.length > 0 ||
      searchQuery.length > 0,
    [config.enableFolders, config.enableTags, selectedFolderId, selectedTagIds, selectedMimeTypes, searchQuery]
  );

  const activeFilterCount = useMemo(
    () =>
      (config.enableFolders && selectedFolderId ? 1 : 0) +
      (config.enableTags ? selectedTagIds.length : 0) +
      selectedMimeTypes.length +
      (searchQuery.length > 0 ? 1 : 0),
    [config.enableFolders, config.enableTags, selectedFolderId, selectedTagIds, selectedMimeTypes, searchQuery]
  );

  // Actions - Selection
  const handleSetSelectedFolderId = useCallback((folderId: string | null) => {
    setSelectedFolderId(folderId);
    setSelectedTagIds([]); // Clear tags when changing folders
    setCurrentPage(1);
  }, []);

  const handleSetSelectedTagIds = useCallback((tagIds: string[]) => {
    setSelectedTagIds(tagIds);
    setCurrentPage(1);
  }, []);

  const handleToggleTagId = useCallback((tagId: string) => {
    setSelectedTagIds(prev => (prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]));
    setCurrentPage(1);
  }, []);

  const handleSetSelectedMimeTypes = useCallback((mimeTypes: string[]) => {
    setSelectedMimeTypes(mimeTypes);
    setCurrentPage(1);
  }, []);

  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    if (config.enableFolders) setSelectedFolderId(null);
    if (config.enableTags) setSelectedTagIds([]);
    setSelectedMimeTypes([]);
    setSearchQuery("");
    setCurrentPage(1);
  }, [config.enableFolders, config.enableTags]);

  // Actions - Asset operations
  const handleCopyUrl = useCallback(async (asset: IAsset) => {
    try {
      await navigator.clipboard.writeText(asset.url);
      // Toast would be handled by the app
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = asset.url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setActiveAssetAction(null);
  }, []);

  const handleAssetAction = useCallback(
    (payload: IAssetActionPayload) => {
      setActiveAssetAction({ action: payload.action, asset: payload.asset });

      switch (payload.action) {
        case "delete":
          onDeleteAsset?.(payload.asset);
          setActiveAssetAction(null);
          break;
        case "assign_tags":
          onAssignTags?.(payload.asset);
          setActiveAssetAction(null);
          break;
        case "move":
          onMoveAsset?.(payload.asset);
          setActiveAssetAction(null);
          break;
        case "toggle_privacy":
          onTogglePrivacy?.(payload.asset).finally(() => {
            setActiveAssetAction(null);
          });
          break;
        case "copy_url":
          handleCopyUrl(payload.asset);
          break;
        case "preview":
          onPreviewAsset?.(payload.asset);
          setActiveAssetAction(null);
          break;
        case "download":
          onDownloadAsset?.(payload.asset);
          setActiveAssetAction(null);
          break;
        case "edit":
          onEditAsset?.(payload.asset);
          setActiveAssetAction(null);
          break;
        case "tag_toggle":
          if (payload.tag) {
            handleToggleTagId(payload.tag.id);
          }
          setActiveAssetAction(null);
          break;
      }
    },
    [
      onDeleteAsset,
      onAssignTags,
      onMoveAsset,
      onTogglePrivacy,
      onPreviewAsset,
      onDownloadAsset,
      onEditAsset,
      handleCopyUrl,
      handleToggleTagId,
    ]
  );

  const getOngoingAssetAction = useCallback(
    (asset: IAsset): { action: IAssetAction | null } => {
      if (activeAssetAction?.asset?.id === asset.id) {
        return { action: activeAssetAction.action };
      }
      return { action: null };
    },
    [activeAssetAction]
  );

  // Context value
  const value = useMemo<MediaLibraryContextValue>(
    () => ({
      // Configuration
      config,
      api,

      // State
      selectedFolderId,
      selectedTagIds,
      selectedMimeTypes,
      searchQuery,
      viewMode,
      currentPage,
      isUploadDialogOpen,
      isFolderSidebarOpen,
      activeAssetAction,

      // Data
      assets,
      folderTree,
      tags,
      isLoadingAssets,
      isLoadingFolders,
      isLoadingTags,

      // Computed
      currentFolderPath,
      hasActiveFilters,
      activeFilterCount,

      // Actions - Selection
      setSelectedFolderId: handleSetSelectedFolderId,
      setSelectedTagIds: handleSetSelectedTagIds,
      toggleTagId: handleToggleTagId,
      setSelectedMimeTypes: handleSetSelectedMimeTypes,
      setSearchQuery: handleSetSearchQuery,
      setViewMode,
      setCurrentPage,
      clearFilters: handleClearFilters,

      // Actions - UI
      openUploadDialog: () => setIsUploadDialogOpen(true),
      closeUploadDialog: () => setIsUploadDialogOpen(false),
      toggleFolderSidebar: () => setIsFolderSidebarOpen(prev => !prev),

      // Actions - Asset operations
      onAssetAction: handleAssetAction,
      getOngoingAssetAction,

      // Refresh
      refreshAssets: onRefreshAssets || (() => {}),
      refreshFolders: onRefreshFolders || (() => {}),
      refreshTags: onRefreshTags || (() => {}),
    }),
    [
      config,
      api,
      selectedFolderId,
      selectedTagIds,
      selectedMimeTypes,
      searchQuery,
      viewMode,
      currentPage,
      isUploadDialogOpen,
      isFolderSidebarOpen,
      activeAssetAction,
      assets,
      folderTree,
      tags,
      isLoadingAssets,
      isLoadingFolders,
      isLoadingTags,
      currentFolderPath,
      hasActiveFilters,
      activeFilterCount,
      handleSetSelectedFolderId,
      handleSetSelectedTagIds,
      handleToggleTagId,
      handleSetSelectedMimeTypes,
      handleSetSearchQuery,
      handleClearFilters,
      handleAssetAction,
      getOngoingAssetAction,
      onRefreshAssets,
      onRefreshFolders,
      onRefreshTags,
    ]
  );

  return <MediaLibraryContext.Provider value={value}>{children}</MediaLibraryContext.Provider>;
}

// ============================================================================
// Helper hook for building query params
// ============================================================================

export function useAssetQueryParams(): IAssetListParams {
  const { config, selectedFolderId, selectedTagIds, selectedMimeTypes, searchQuery, currentPage } = useMediaLibrary();

  return useMemo(
    () => ({
      folderId: config.enableFolders ? selectedFolderId : undefined,
      tagIds: config.enableTags && selectedTagIds.length > 0 ? selectedTagIds : undefined,
      contentType: selectedMimeTypes.length > 0 ? selectedMimeTypes : undefined,
      search: searchQuery || undefined,
      $page: currentPage,
      $limit: config.pageSize,
    }),
    [config, selectedFolderId, selectedTagIds, selectedMimeTypes, searchQuery, currentPage]
  );
}
