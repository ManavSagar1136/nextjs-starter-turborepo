"use client";

import { useEffect, useRef, useState } from "react";
import { FolderPlus, PanelLeft, Upload, X } from "lucide-react";

import { Button } from "@buildbase/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@buildbase/ui/sheet";
import { cn } from "@buildbase/ui/lib/utils";

import { AssetGrid } from "./AssetGrid";
import { BreadcrumbNav } from "./BreadcrumbNav";
import { BulkActionsBar } from "./BulkActionsBar";
import { useMediaLibrary } from "./context";
import { FolderSidebar } from "./FolderTree";
import { SearchAndFilters } from "./SearchAndFilters";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { type IFolderTreeItem } from "./types";

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
}: MediaLibraryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { config, isLoadingFolders, selectedAssetIds, selectAllAssets, clearAssetSelection } = useMediaLibrary();

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

    window.addEventListener("media-library:move-asset", handleMoveAsset);
    return () => {
      window.removeEventListener("media-library:move-asset", handleMoveAsset);
    };
  }, [onBulkMove]);

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
  });

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
            <SearchAndFilters searchInputRef={searchInputRef} />
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
          <SearchAndFilters />
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <AssetGrid scrollContainerRef={scrollRef} />
      </div>
    </div>
  );
}
