"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Badge } from "@buildbase/ui/badge";
import { Button } from "@buildbase/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";

import type { AssignTagsDialogProps } from "./types";

export function AssignTagsDialog({
  open,
  onOpenChange,
  assetId,
  currentTags,
  allTags,
  isLoadingTags = false,
  tagsError,
  onRetryLoadTags,
  isLoading = false,
  onSaveTags,
}: AssignTagsDialogProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(currentTags.map(t => t.id));
  const [isPending, setIsPending] = useState(false);

  // Sync selection when dialog opens or tags change
  useEffect(() => {
    if (open) {
      setSelectedTagIds(currentTags.map(t => t.id));
    }
  }, [open, currentTags]);

  const handleToggle = (tagId: string) => {
    setSelectedTagIds(prev => (prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    setIsPending(true);
    try {
      await onSaveTags(selectedTagIds);
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  };

  const loading = isLoading || isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>Select tags to assign to this asset.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-4">
            {/* Loading state */}
            {isLoadingTags && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                <span className="text-muted-foreground ml-2 text-sm">Loading tags...</span>
              </div>
            )}

            {/* Error state */}
            {tagsError && !isLoadingTags && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border p-4 text-center">
                <AlertCircle className="text-destructive h-8 w-8" />
                <span className="text-destructive text-sm">{tagsError}</span>
                {onRetryLoadTags && (
                  <Button variant="outline" size="sm" onClick={onRetryLoadTags}>
                    Retry
                  </Button>
                )}
              </div>
            )}

            {/* Empty state */}
            {!isLoadingTags && !tagsError && allTags.length === 0 && (
              <div className="bg-muted/30 flex flex-col items-center justify-center gap-3 rounded-lg border p-4 py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  No tags found. Create tags first, then return here to assign them.
                </p>
              </div>
            )}

            {/* Tags list */}
            {!isLoadingTags && !tagsError && allTags.length > 0 && (
              <div className="flex max-h-[300px] flex-wrap gap-2 overflow-y-auto">
                {allTags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-all hover:opacity-80 ${
                        loading ? "pointer-events-none opacity-50" : ""
                      }`}
                      style={
                        isSelected && tag.color
                          ? {
                              backgroundColor: tag.color,
                              borderColor: tag.color,
                              color: "white",
                            }
                          : tag.color
                            ? {
                                borderColor: tag.color + "60",
                                color: tag.color,
                              }
                            : undefined
                      }
                      onClick={() => handleToggle(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !!tagsError || allTags.length === 0}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
