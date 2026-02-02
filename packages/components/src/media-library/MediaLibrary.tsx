"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FolderPlus, PanelLeft, Upload, X } from "lucide-react";

import { Button } from "@buildbase/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@buildbase/ui/sheet";
import { ErrorBoundary } from "@buildbase/ui/components/ui/error-boundary";
import { cn } from "@buildbase/ui/lib/utils";

import { AssetGrid } from "./AssetGrid";
import { BreadcrumbNav } from "./BreadcrumbNav";
import { BulkActionsBar } from "./BulkActionsBar";
import { useMediaLibrary } from "./context";
import { FolderSidebar } from "./FolderTree";
import { SearchAndFilters } from "./SearchAndFilters";
import { ASSET_ACTIONS, type IFolderTreeItem } from "./types";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";

// ============================================================================
// Types
// ============================================================================

interface MediaLibraryProps {
  className?: string;
  /** Custom header content */
  headerContent?: React.ReactNode;
  /** Custom actions to show in the header */
  actions?: React.ReactNode;
  /** Callback when upload is requested */
  onUpload?: () => void;
  /** Callback when create folder is requested */
  onCreateFolder?: () => void;
  /** Callback when edit folder is requested */
  onEditFolder?: (folder: IFolderTreeItem) => void;
  /** Callback when delete folder is requested */
  onDeleteFolder?: (folder: IFolderTreeItem) => void;
  /** Callback when move folder is requested */
  onMoveFolder?: (folder: IFolderTreeItem) => void;
  /** Callback when bulk delete is requested */
  onBulkDelete?: (assetIds: string[]) => void;
  /** Callback when bulk move is requested */
  onBulkMove?: (assetIds: string[]) => void;
  /** Callback when bulk assign tags is requested */
  onBulkAssignTags?: (assetIds: string[]) => void;
  /** Callback when create tag is requested */
  onCreateTag?: () => void;
  /** Callback when edit tag is requested */
  onEditTag?: (tag: { id: string; name: string; color?: string | null }) => void;
  /** Callback when delete tag is requested */
  onDeleteTag?: (tag: { id: string; name: string; color?: string | null }) => void;
}

// ============================================================================
// Media Library Component
// ============================================================================

export function MediaLibrary({
  className,
  headerContent,
  actions,
  onUpload,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onMoveFolder,
  onBulkDelete,
  onBulkMove,
  onBulkAssignTags,
  onCreateTag,
  onEditTag,
  onDeleteTag,
}: MediaLibraryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    config,
    isLoadingFolders,
    selectedAssetIds,
    focusedAssetId,
    assets,
    viewMode,
    selectAllAssets,
    clearAssetSelection,
    setFocusedAssetId,
    toggleAssetSelection,
    onAssetAction,
  } = useMediaLibrary();

  // Handle drag and drop for moving assets to folders
  useEffect(() => {
    const handleMoveAsset = (event: Event) => {
      const customEvent = event as CustomEvent<{ assetId: string; targetFolderId: string }>;
      const { assetId, targetFolderId } = customEvent.detail;
      // For drag-drop, we need to directly move to the target folder
      // This requires updating the move dialog or creating a direct move function
      // For now, trigger the move dialog which will allow user to confirm
      if (onBulkMove && assetId) {
        onBulkMove([assetId]);
      }
    };

    const handleMoveFolder = (event: Event) => {
      const customEvent = event as CustomEvent<{ folderId: string; targetParentFolderId: string }>;
      const { folderId, targetParentFolderId } = customEvent.detail;
      // Trigger move folder callback if available
      // The parent component should handle the actual API call
      if (onMoveFolder) {
        // We need to find the folder object - for now, dispatch to parent
        // Parent should handle finding the folder and calling the API
        window.dispatchEvent(
          new CustomEvent<{ folderId: string; targetParentFolderId: string }>("media-library:move-folder-confirm", {
            detail: { folderId, targetParentFolderId },
          })
        );
      }
    };

    window.addEventListener("media-library:move-asset", handleMoveAsset);
    window.addEventListener("media-library:move-folder", handleMoveFolder);
    return () => {
      window.removeEventListener("media-library:move-asset", handleMoveAsset);
      window.removeEventListener("media-library:move-folder", handleMoveFolder);
    };
  }, [onBulkMove, onMoveFolder]);

  // Arrow key navigation
  const handleArrowKey = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      if (!assets?.docs || assets.docs.length === 0) return;

      const currentIndex = focusedAssetId ? assets.docs.findIndex(a => a.id === focusedAssetId) : -1;
      let nextIndex = currentIndex;

      if (viewMode === "list") {
        // List view: up/down only
        if (direction === "up") {
          nextIndex = currentIndex <= 0 ? assets.docs.length - 1 : currentIndex - 1;
        } else if (direction === "down") {
          nextIndex = currentIndex >= assets.docs.length - 1 ? 0 : currentIndex + 1;
        }
      } else {
        // Grid view: all directions
        const cols =
          viewMode === "grid"
            ? window.innerWidth >= 1536
              ? 5
              : window.innerWidth >= 1280
                ? 4
                : window.innerWidth >= 1024
                  ? 3
                  : window.innerWidth >= 640
                    ? 2
                    : 1
            : 1;
        if (direction === "up") {
          nextIndex = currentIndex < cols ? assets.docs.length - 1 : Math.max(0, currentIndex - cols);
        } else if (direction === "down") {
          nextIndex =
            currentIndex >= assets.docs.length - cols ? 0 : Math.min(assets.docs.length - 1, currentIndex + cols);
        } else if (direction === "left") {
          nextIndex = currentIndex <= 0 ? assets.docs.length - 1 : currentIndex - 1;
        } else if (direction === "right") {
          nextIndex = currentIndex >= assets.docs.length - 1 ? 0 : currentIndex + 1;
        }
      }

      if (nextIndex >= 0 && nextIndex < assets.docs.length) {
        const nextAsset = assets.docs[nextIndex];
        if (nextAsset) {
          setFocusedAssetId(nextAsset.id);
        }
      }
    },
    [assets, focusedAssetId, viewMode, setFocusedAssetId]
  );

  // Shift + Arrow for multi-select
  const handleShiftArrow = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      if (!assets?.docs || assets.docs.length === 0) return;

      const currentIndex = focusedAssetId ? assets.docs.findIndex(a => a.id === focusedAssetId) : -1;
      if (currentIndex === -1) {
        // If no focused asset, focus first one
        const firstAsset = assets.docs[0];
        if (firstAsset) {
          setFocusedAssetId(firstAsset.id);
        }
        return;
      }

      // Calculate next index
      let nextIndex = currentIndex;
      if (viewMode === "list") {
        if (direction === "up") {
          nextIndex = currentIndex <= 0 ? assets.docs.length - 1 : currentIndex - 1;
        } else if (direction === "down") {
          nextIndex = currentIndex >= assets.docs.length - 1 ? 0 : currentIndex + 1;
        }
      } else {
        const cols =
          window.innerWidth >= 1536
            ? 5
            : window.innerWidth >= 1280
              ? 4
              : window.innerWidth >= 1024
                ? 3
                : window.innerWidth >= 640
                  ? 2
                  : 1;
        if (direction === "up") {
          nextIndex = currentIndex < cols ? assets.docs.length - 1 : Math.max(0, currentIndex - cols);
        } else if (direction === "down") {
          nextIndex =
            currentIndex >= assets.docs.length - cols ? 0 : Math.min(assets.docs.length - 1, currentIndex + cols);
        } else if (direction === "left") {
          nextIndex = currentIndex <= 0 ? assets.docs.length - 1 : currentIndex - 1;
        } else if (direction === "right") {
          nextIndex = currentIndex >= assets.docs.length - 1 ? 0 : currentIndex + 1;
        }
      }

      if (nextIndex >= 0 && nextIndex < assets.docs.length) {
        const nextAsset = assets.docs[nextIndex];
        if (nextAsset) {
          setFocusedAssetId(nextAsset.id);
          // Toggle selection of the newly focused asset
          toggleAssetSelection(nextAsset.id);
        }
      }
    },
    [assets, focusedAssetId, viewMode, setFocusedAssetId, toggleAssetSelection]
  );

  // Enter key - open preview
  const handleEnter = useCallback(() => {
    if (focusedAssetId && assets?.docs) {
      const asset = assets.docs.find(a => a.id === focusedAssetId);
      if (asset && onAssetAction) {
        onAssetAction({ action: ASSET_ACTIONS.PREVIEW, asset });
      }
    } else if (selectedAssetIds.length === 1 && assets?.docs) {
      const asset = assets.docs.find(a => a.id === selectedAssetIds[0]);
      if (asset && onAssetAction) {
        onAssetAction({ action: ASSET_ACTIONS.PREVIEW, asset });
      }
    }
  }, [focusedAssetId, selectedAssetIds, assets, onAssetAction]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearchFocus: () => {
      searchInputRef.current?.focus();
    },
    onSelectAll: () => {
      selectAllAssets();
    },
    onDelete: () => {
      if (selectedAssetIds.length > 0 && onBulkDelete) {
        onBulkDelete(selectedAssetIds);
      }
    },
    onMove: () => {
      if (selectedAssetIds.length > 0 && onBulkMove) {
        onBulkMove(selectedAssetIds);
      }
    },
    onAssignTags: () => {
      if (selectedAssetIds.length > 0 && onBulkAssignTags) {
        onBulkAssignTags(selectedAssetIds);
      }
    },
    onClearSelection: () => {
      clearAssetSelection();
    },
    onEscape: () => {
      clearAssetSelection();
      setMobileSidebarOpen(false);
    },
    onArrowKey: handleArrowKey,
    onEnter: handleEnter,
    onShiftArrow: handleShiftArrow,
  });

  // File upload drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if dragging files
    if (e.dataTransfer.types.includes("Files")) {
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if leaving the main container (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      // Get dropped files
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0 && onUpload) {
        // Trigger upload with files
        // The parent component should handle opening upload dialog or direct upload
        window.dispatchEvent(
          new CustomEvent<{ files: File[] }>("media-library:upload-files", {
            detail: { files },
          })
        );
        // Also call onUpload if it accepts files directly
        if (typeof onUpload === "function") {
          // Check if onUpload accepts files - if not, it's just a callback to open dialog
          onUpload();
        }
      }
    },
    [onUpload]
  );

  return (
    <div className={cn("bg-background flex h-full overflow-hidden", className)}>
      {/* Desktop Sidebar */}
      {config.enableFolders && (
        <div className="border-border bg-card/50 hidden w-64 flex-col border-r md:flex lg:w-72">
          <FolderSidebar
            onCreateFolder={onCreateFolder}
            onEditFolder={onEditFolder}
            onDeleteFolder={onDeleteFolder}
            onMoveFolder={onMoveFolder}
          />
        </div>
      )}

      {/* Mobile Sidebar */}
      {config.enableFolders && (
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="flex w-80 flex-col p-0">
            <SheetHeader className="border-border flex flex-row items-center justify-between border-b p-4">
              <SheetTitle>Folders</SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </SheetHeader>
            <FolderSidebar
              onCreateFolder={() => {
                onCreateFolder?.();
                setMobileSidebarOpen(false);
              }}
              onEditFolder={folder => {
                onEditFolder?.(folder);
                setMobileSidebarOpen(false);
              }}
              onDeleteFolder={folder => {
                onDeleteFolder?.(folder);
                setMobileSidebarOpen(false);
              }}
              onMoveFolder={folder => {
                onMoveFolder?.(folder);
                setMobileSidebarOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="border-border bg-card/50 shrink-0 border-b">
          <div className="p-4 lg:p-5">
            {/* Title and Actions Row */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2">
                {/* Mobile sidebar toggle */}
                {config.enableFolders && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 shrink-0 p-0 md:hidden"
                    onClick={() => setMobileSidebarOpen(true)}
                  >
                    <PanelLeft className="h-5 w-5" />
                  </Button>
                )}

                {/* Breadcrumb */}
                {config.enableFolders && <BreadcrumbNav maxVisibleItems={3} />}

                {/* Custom header content */}
                {headerContent}
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <KeyboardShortcutsDialog />
                {actions}

                {config.enableFolders && onCreateFolder && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCreateFolder}
                    disabled={isLoadingFolders}
                    className="hidden gap-1.5 sm:flex"
                  >
                    <FolderPlus className="h-4 w-4" />
                    <span className="hidden lg:inline">{config.labels.newFolderButton}</span>
                  </Button>
                )}

                {config.enableUpload && onUpload && (
                  <Button size="sm" onClick={onUpload} className="gap-1.5">
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">{config.labels.uploadButton}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Search and Filters */}
            <SearchAndFilters
              searchInputRef={searchInputRef}
              onCreateTag={onCreateTag}
              onEditTag={onEditTag}
              onDeleteTag={onDeleteTag}
            />
          </div>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <AssetGrid scrollContainerRef={scrollRef} />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar onBulkDelete={onBulkDelete} onBulkMove={onBulkMove} onBulkAssignTags={onBulkAssignTags} />
    </div>
  );
}

// ============================================================================
// Minimal Media Library (without sidebar, for embedded use)
// ============================================================================

interface MinimalMediaLibraryProps {
  className?: string;
  /** Custom actions to show in the header */
  actions?: React.ReactNode;
  /** Callback when upload is requested */
  onUpload?: () => void;
}

export function MinimalMediaLibrary({ className, actions, onUpload }: MinimalMediaLibraryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { config } = useMediaLibrary();
  const [isDragOver, setIsDragOver] = useState(false);

  // File upload drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if dragging files
    if (e.dataTransfer.types.includes("Files")) {
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if leaving the main container (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      // Get dropped files
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0 && onUpload) {
        // Trigger upload with files
        window.dispatchEvent(
          new CustomEvent<{ files: File[] }>("media-library:upload-files", {
            detail: { files },
          })
        );
        // Call onUpload to open dialog
        onUpload();
      }
    },
    [onUpload]
  );

  return (
    <div className={cn("bg-background flex h-full flex-col", className)}>
      {/* Header */}
      <div className="border-border bg-card/50 shrink-0 border-b">
        <div className="p-4">
          {/* Actions Row */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{config.labels.title}</h2>

            <div className="flex items-center gap-2">
              {actions}

              {config.enableUpload && onUpload && (
                <Button size="sm" onClick={onUpload} className="gap-1.5">
                  <Upload className="h-4 w-4" />
                  {config.labels.uploadButton}
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <SearchAndFilters onCreateTag={onCreateTag} onEditTag={onEditTag} onDeleteTag={onDeleteTag} />
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="relative flex-1 overflow-auto"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragOver && (
          <div className="bg-primary/10 border-primary absolute inset-0 z-50 flex items-center justify-center rounded-lg border-2 border-dashed">
            <div className="bg-background rounded-lg p-8 text-center shadow-lg">
              <div className="text-primary mb-2 text-4xl">📁</div>
              <p className="text-lg font-semibold">Drop files to upload</p>
              <p className="text-muted-foreground text-sm">Release to add files to your media library</p>
            </div>
          </div>
        )}
        <AssetGrid scrollContainerRef={scrollRef} />
      </div>
    </div>
  );
}
