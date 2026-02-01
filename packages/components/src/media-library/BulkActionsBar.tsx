"use client";

import { Folder, Tag, Trash2, X } from "lucide-react";

import { Button } from "@buildbase/ui/button";
import { cn } from "@buildbase/ui/lib/utils";

import { useMediaLibrary } from "./context";

// ============================================================================
// Types
// ============================================================================

interface BulkActionsBarProps {
  className?: string;
  onBulkDelete?: (assetIds: string[]) => void;
  onBulkMove?: (assetIds: string[]) => void;
  onBulkAssignTags?: (assetIds: string[]) => void;
}

// ============================================================================
// Bulk Actions Bar
// ============================================================================

export function BulkActionsBar({ className, onBulkDelete, onBulkMove, onBulkAssignTags }: BulkActionsBarProps) {
  const { selectedAssetIds, clearAssetSelection, config } = useMediaLibrary();

  if (selectedAssetIds.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-primary text-primary-foreground fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg px-4 py-3 shadow-lg",
        className
      )}
      role="toolbar"
      aria-label="Bulk actions toolbar"
    >
      <span className="text-sm font-medium" aria-live="polite" aria-atomic="true">
        {selectedAssetIds.length} {selectedAssetIds.length === 1 ? "asset" : "assets"} selected
      </span>

      <div className="flex items-center gap-2">
        {onBulkMove && config.enableFolders && (
          <Button
            size="sm"
            variant="secondary"
            className="bg-background/20 hover:bg-background/30 text-primary-foreground border-0"
            onClick={() => {
              onBulkMove(selectedAssetIds);
              clearAssetSelection();
            }}
            aria-label={`Move ${selectedAssetIds.length} selected assets`}
            title="Move selected assets (Ctrl/Cmd + M)"
          >
            <Folder className="mr-2 h-4 w-4" aria-hidden="true" />
            Move
          </Button>
        )}

        {onBulkAssignTags && config.enableTags && (
          <Button
            size="sm"
            variant="secondary"
            className="bg-background/20 hover:bg-background/30 text-primary-foreground border-0"
            onClick={() => {
              onBulkAssignTags(selectedAssetIds);
              clearAssetSelection();
            }}
            aria-label={`Assign tags to ${selectedAssetIds.length} selected assets`}
            title="Assign tags to selected assets (Ctrl/Cmd + T)"
          >
            <Tag className="mr-2 h-4 w-4" aria-hidden="true" />
            Assign Tags
          </Button>
        )}

        {onBulkDelete && (
          <Button
            size="sm"
            variant="secondary"
            className="bg-destructive/20 hover:bg-destructive/30 text-primary-foreground border-0"
            onClick={() => {
              onBulkDelete(selectedAssetIds);
              clearAssetSelection();
            }}
            aria-label={`Delete ${selectedAssetIds.length} selected assets`}
            title="Delete selected assets (Delete)"
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="text-primary-foreground hover:bg-background/20 h-8 w-8 p-0"
          onClick={clearAssetSelection}
          aria-label="Clear selection"
          title="Clear selection (Escape)"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
