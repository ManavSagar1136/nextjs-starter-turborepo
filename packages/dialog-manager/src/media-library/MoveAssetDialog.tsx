"use client";

import { useState } from "react";
import { FolderTree } from "lucide-react";

import { Button } from "@buildbase/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";

import { FolderTreeSelect } from "./FolderTreeSelect";
import type { MoveAssetDialogProps } from "./types";

export function MoveAssetDialog({
  open,
  onOpenChange,
  assetId,
  assetName,
  currentFolderId,
  currentFolderPath,
  folderTree,
  isLoadingTree = false,
  isLoading = false,
  onMoveAsset,
}: MoveAssetDialogProps) {
  const [targetFolderId, setTargetFolderId] = useState<string | null>(currentFolderId ?? null);
  const [isPending, setIsPending] = useState(false);

  const isSameLocation = targetFolderId === (currentFolderId ?? null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSameLocation || isPending) return;

    setIsPending(true);
    try {
      await onMoveAsset(targetFolderId);
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  };

  const loading = isLoading || isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Move Asset</DialogTitle>
          <DialogDescription>
            Move <span className="font-semibold">{assetName}</span> to a different folder.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Current location */}
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">Current location</p>
              <div className="bg-muted/50 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium">
                <FolderTree className="text-muted-foreground h-3.5 w-3.5" />
                <span className="max-w-[260px] truncate">{currentFolderPath || "Root (No Folder)"}</span>
              </div>
            </div>

            {/* Destination folder */}
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">Destination folder</p>
              <FolderTreeSelect
                value={targetFolderId}
                onChange={setTargetFolderId}
                folders={folderTree}
                isLoading={isLoadingTree}
              />
            </div>

            {/* Same location warning */}
            {isSameLocation && (
              <p className="text-destructive text-xs">This asset is already in the selected location.</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isSameLocation}>
              {isPending ? "Moving..." : "Move"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
