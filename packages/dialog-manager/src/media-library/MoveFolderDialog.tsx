"use client";

import { useEffect, useState } from "react";
import { Folder } from "lucide-react";

import { Button } from "@buildbase/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";

import { FolderTreeSelect } from "./FolderTreeSelect";
import type { MoveFolderDialogProps } from "./types";

export function MoveFolderDialog({
  open,
  onOpenChange,
  folderId,
  folderName,
  currentParentFolderId,
  folderTree,
  isLoadingTree = false,
  isLoading = false,
  onMoveFolder,
}: MoveFolderDialogProps) {
  const [targetParentFolderId, setTargetParentFolderId] = useState<string | null>(currentParentFolderId ?? null);
  const [isPending, setIsPending] = useState(false);

  // Reset target when dialog opens or current parent changes
  useEffect(() => {
    if (open) {
      setTargetParentFolderId(currentParentFolderId ?? null);
    }
  }, [open, currentParentFolderId]);

  const isSameLocation = targetParentFolderId === (currentParentFolderId ?? null);

  // Collect all descendant folder IDs to exclude from selection
  const getDescendantIds = (folders: typeof folderTree, targetId: string): string[] => {
    const ids: string[] = [];
    const findAndCollect = (items: typeof folderTree): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          // Found the target, collect all descendants
          const collectDescendants = (folder: typeof item) => {
            ids.push(folder.id);
            if (folder.children) {
              folder.children.forEach(collectDescendants);
            }
          };
          collectDescendants(item);
          return true;
        }
        if (item.children && findAndCollect(item.children)) {
          return true;
        }
      }
      return false;
    };
    findAndCollect(folders);
    return ids;
  };

  // Exclude the folder being moved and all its descendants
  const excludeFolderIds = [folderId, ...getDescendantIds(folderTree, folderId)];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSameLocation || isPending) return;

    setIsPending(true);
    try {
      await onMoveFolder(targetParentFolderId);
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
          <DialogTitle>Move Folder</DialogTitle>
          <DialogDescription>
            Move <span className="font-semibold">{folderName}</span> to a different location.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Folder being moved */}
            <div className="bg-muted/50 border-border rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <Folder className="text-primary h-4 w-4" />
                <span className="font-medium">{folderName}</span>
              </div>
            </div>

            {/* Destination parent folder */}
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">Select new parent folder</p>
              <FolderTreeSelect
                value={targetParentFolderId}
                onChange={setTargetParentFolderId}
                folders={folderTree}
                isLoading={isLoadingTree}
                excludeFolderIds={excludeFolderIds}
                rootLabel="Root (Top Level)"
              />
            </div>

            {/* Same location warning */}
            {isSameLocation && (
              <p className="text-destructive text-xs">This folder is already in the selected location.</p>
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
