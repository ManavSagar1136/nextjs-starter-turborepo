"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen, MoreVertical, Pencil, Trash2 } from "lucide-react";

import { Button } from "@buildbase/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@buildbase/ui/dropdown-menu";
import { cn } from "@buildbase/ui/lib/utils";

import { useMediaLibrary } from "./context";
import { type IFolderTreeItem } from "./types";

// ============================================================================
// Types
// ============================================================================

interface FolderTreeProps {
  className?: string;
  /** Called when edit is requested */
  onEditFolder?: (folder: IFolderTreeItem) => void;
  /** Called when delete is requested */
  onDeleteFolder?: (folder: IFolderTreeItem) => void;
  /** Called when move is requested */
  onMoveFolder?: (folder: IFolderTreeItem) => void;
}

interface FolderItemProps {
  folder: IFolderTreeItem;
  depth: number;
  isSelected: boolean;
  onSelect: (folderId: string | null) => void;
  onEditFolder?: (folder: IFolderTreeItem) => void;
  onDeleteFolder?: (folder: IFolderTreeItem) => void;
  onMoveFolder?: (folder: IFolderTreeItem) => void;
}

// ============================================================================
// Folder Item
// ============================================================================

function FolderItem({
  folder,
  depth,
  isSelected,
  onSelect,
  onEditFolder,
  onDeleteFolder,
  onMoveFolder,
}: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const hasChildren = folder.children && folder.children.length > 0;
  const assetCount = folder._count?.assets || 0;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const data = e.dataTransfer.getData("application/json");
      if (data) {
        const { type, id } = JSON.parse(data);
        if (type === "asset" && id) {
          // Trigger move asset callback via custom event with target folder
          window.dispatchEvent(
            new CustomEvent<{ assetId: string; targetFolderId: string }>("media-library:move-asset", {
              detail: { assetId: id, targetFolderId: folder.id },
            })
          );
        }
      }
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5",
          "hover:bg-accent transition-colors",
          isSelected && "bg-accent",
          isDragOver && "bg-primary/20 ring-primary ring-2"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(folder.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button onClick={handleToggleExpand} className="hover:bg-accent-foreground/10 shrink-0 rounded p-0.5">
            {isExpanded ? (
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5" /> // Spacer
        )}

        {/* Folder icon */}
        {isExpanded && hasChildren ? (
          <FolderOpen className="text-primary h-4 w-4 shrink-0" />
        ) : (
          <Folder className="text-muted-foreground h-4 w-4 shrink-0" />
        )}

        {/* Folder name */}
        <span className="flex-1 truncate text-sm">{folder.name}</span>

        {/* Asset count */}
        {assetCount > 0 && <span className="text-muted-foreground text-xs">{assetCount}</span>}

        {/* Actions menu */}
        {isHovered && (onEditFolder || onDeleteFolder || onMoveFolder) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={e => e.stopPropagation()}>
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {onEditFolder && (
                <DropdownMenuItem
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onEditFolder(folder);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
              )}
              {onMoveFolder && (
                <DropdownMenuItem
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onMoveFolder(folder);
                  }}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  Move
                </DropdownMenuItem>
              )}
              {(onEditFolder || onMoveFolder) && onDeleteFolder && <DropdownMenuSeparator />}
              {onDeleteFolder && (
                <DropdownMenuItem
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onDeleteFolder(folder);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map(child => (
            <FolderItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              isSelected={false} // Will be handled by parent
              onSelect={onSelect}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              onMoveFolder={onMoveFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function FolderTreeSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex animate-pulse items-center gap-2 px-2 py-1.5">
          <div className="bg-muted h-4 w-4 rounded" />
          <div className="bg-muted h-4 w-4 rounded" />
          <div className="bg-muted h-4 flex-1 rounded" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyFolderTree() {
  const { config } = useMediaLibrary();

  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      <Folder className="text-muted-foreground mb-2 h-8 w-8" />
      <p className="text-muted-foreground text-sm">{config.labels.noFolders}</p>
    </div>
  );
}

// ============================================================================
// Folder Tree Component
// ============================================================================

export function FolderTree({ className, onEditFolder, onDeleteFolder, onMoveFolder }: FolderTreeProps) {
  const { config, folderTree, isLoadingFolders, selectedFolderId, setSelectedFolderId } = useMediaLibrary();

  // Check if this folder or any of its descendants is selected
  const isFolderOrDescendantSelected = (folder: IFolderTreeItem, targetId: string | null): boolean => {
    if (!targetId) return false;
    if (folder.id === targetId) return true;
    if (folder.children) {
      return folder.children.some(child => isFolderOrDescendantSelected(child, targetId));
    }
    return false;
  };

  if (isLoadingFolders) {
    return (
      <div className={className}>
        <FolderTreeSkeleton />
      </div>
    );
  }

  if (!folderTree || folderTree.length === 0) {
    return (
      <div className={className}>
        <EmptyFolderTree />
      </div>
    );
  }

  return (
    <div className={cn("space-y-0.5", className)}>
      {folderTree.map(folder => (
        <FolderItem
          key={folder.id}
          folder={folder}
          depth={0}
          isSelected={folder.id === selectedFolderId}
          onSelect={setSelectedFolderId}
          onEditFolder={onEditFolder}
          onDeleteFolder={onDeleteFolder}
          onMoveFolder={onMoveFolder}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Folder Sidebar (Full sidebar with "All Assets" button)
// ============================================================================

interface FolderSidebarProps {
  className?: string;
  onCreateFolder?: () => void;
  onEditFolder?: (folder: IFolderTreeItem) => void;
  onDeleteFolder?: (folder: IFolderTreeItem) => void;
  onMoveFolder?: (folder: IFolderTreeItem) => void;
}

export function FolderSidebar({
  className,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onMoveFolder,
}: FolderSidebarProps) {
  const { config, selectedFolderId, setSelectedFolderId, isLoadingFolders } = useMediaLibrary();

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className="border-border border-b p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Folders</h2>
          {onCreateFolder && (
            <Button
              size="sm"
              variant="outline"
              onClick={onCreateFolder}
              disabled={isLoadingFolders}
              className="h-7 text-xs"
            >
              New
            </Button>
          )}
        </div>

        {/* All Assets button */}
        <Button
          variant={selectedFolderId === null ? "secondary" : "ghost"}
          className="h-9 w-full justify-start font-medium"
          onClick={() => setSelectedFolderId(null)}
        >
          <div className="flex items-center gap-2">
            <div className="bg-primary h-1.5 w-1.5 rounded-full" />
            {config.labels.allAssets}
          </div>
        </Button>
      </div>

      {/* Folder Tree */}
      <div className="flex-1 overflow-auto p-2">
        <FolderTree onEditFolder={onEditFolder} onDeleteFolder={onDeleteFolder} onMoveFolder={onMoveFolder} />
      </div>
    </div>
  );
}
