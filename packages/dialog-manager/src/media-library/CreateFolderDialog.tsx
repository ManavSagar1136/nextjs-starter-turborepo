"use client";

import { useEffect, useState } from "react";
import { Folder } from "lucide-react";

import { Button } from "@buildbase/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";
import { Input } from "@buildbase/ui/input";
import { Label } from "@buildbase/ui/label";
import { Textarea } from "@buildbase/ui/textarea";

import { FolderTreeSelect } from "./FolderTreeSelect";
import type { CreateFolderDialogProps } from "./types";

export function CreateFolderDialog({
  open,
  onOpenChange,
  parentFolderId: initialParentFolderId,
  parentFolderName,
  folderTree,
  isLoadingTree = false,
  isLoading = false,
  onCreateFolder,
}: CreateFolderDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedParentFolderId, setSelectedParentFolderId] = useState<string | null>(initialParentFolderId ?? null);
  const [isPending, setIsPending] = useState(false);

  // Reset form when dialog closes or initial parent changes
  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setSelectedParentFolderId(initialParentFolderId ?? null);
    }
  }, [open, initialParentFolderId]);

  // Update selected parent when initial parent changes
  useEffect(() => {
    if (open) {
      setSelectedParentFolderId(initialParentFolderId ?? null);
    }
  }, [initialParentFolderId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isPending) return;

    setIsPending(true);
    try {
      await onCreateFolder({
        name: name.trim(),
        description: description.trim() || undefined,
        parentFolderId: selectedParentFolderId,
      });
      setName("");
      setDescription("");
      setSelectedParentFolderId(null);
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  };

  const loading = isLoading || isPending;
  const canSelectParent = folderTree !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
          <DialogDescription>
            Create a new folder to organize your assets.{" "}
            {canSelectParent ? "Select a parent folder or create at root level." : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Parent folder selection */}
            {canSelectParent ? (
              <div className="space-y-2">
                <Label htmlFor="parent-folder">Parent Folder (Optional)</Label>
                <FolderTreeSelect
                  value={selectedParentFolderId}
                  onChange={setSelectedParentFolderId}
                  folders={folderTree}
                  isLoading={isLoadingTree}
                  rootLabel="Root (Top Level)"
                />
              </div>
            ) : (
              /* Legacy: Show parent folder indicator if provided but no tree available */
              initialParentFolderId &&
              parentFolderName && (
                <div className="bg-muted/50 border-border rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Folder className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">Parent folder:</span>
                    <span className="text-foreground font-medium">{parentFolderName}</span>
                  </div>
                </div>
              )
            )}

            {/* Folder name */}
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Marketing Assets, Product Images"
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="folder-description">Description (Optional)</Label>
              <Textarea
                id="folder-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add a description for this folder"
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || loading}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
