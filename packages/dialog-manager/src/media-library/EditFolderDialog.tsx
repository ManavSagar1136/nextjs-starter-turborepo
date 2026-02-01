"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@buildbase/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";
import { Input } from "@buildbase/ui/input";
import { Label } from "@buildbase/ui/label";
import { Textarea } from "@buildbase/ui/textarea";

import type { EditFolderDialogProps } from "./types";

export function EditFolderDialog({
  open,
  onOpenChange,
  folderId,
  currentName,
  currentDescription,
  isLoading = false,
  error,
  onUpdateFolder,
}: EditFolderDialogProps) {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription || "");
  const [isPending, setIsPending] = useState(false);

  // Sync state when props change
  useEffect(() => {
    if (open) {
      setName(currentName);
      setDescription(currentDescription || "");
    }
  }, [open, currentName, currentDescription]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isPending) return;

    setIsPending(true);
    try {
      await onUpdateFolder({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  };

  const loading = isLoading || isPending;
  const hasChanges = name !== currentName || description !== (currentDescription || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Folder</DialogTitle>
          <DialogDescription>Update folder name and description.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Error message */}
            {error && (
              <div className="bg-destructive/10 border-destructive/20 flex items-center gap-2 rounded-md border p-3">
                <AlertCircle className="text-destructive h-4 w-4 shrink-0" />
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {/* Folder name */}
            <div className="space-y-2">
              <Label htmlFor="edit-folder-name">Folder Name</Label>
              <Input
                id="edit-folder-name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-folder-description">Description (Optional)</Label>
              <Textarea
                id="edit-folder-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !hasChanges || loading}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
