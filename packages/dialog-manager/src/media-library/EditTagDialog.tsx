"use client";

import { useEffect, useState } from "react";

import { Button } from "@buildbase/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";
import { Input } from "@buildbase/ui/input";
import { Label } from "@buildbase/ui/label";

import type { EditTagDialogProps } from "./types";

// Preset colors for tags
const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
  "#0ea5e9", // sky
  "#a855f7", // purple
  "#f43f5e", // rose
];

export function EditTagDialog({
  open,
  onOpenChange,
  tagId,
  currentName,
  currentColor,
  isLoading = false,
  onUpdateTag,
}: EditTagDialogProps) {
  const [name, setName] = useState(currentName);
  const [color, setColor] = useState<string | undefined>(currentColor || undefined);
  const [isPending, setIsPending] = useState(false);

  // Sync state when props change
  useEffect(() => {
    if (open) {
      setName(currentName);
      setColor(currentColor || undefined);
    }
  }, [open, currentName, currentColor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isPending) return;

    setIsPending(true);
    try {
      await onUpdateTag({
        name: name.trim(),
        color: color || undefined,
      });
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  };

  const loading = isLoading || isPending;
  const hasChanges = name !== currentName || color !== (currentColor || undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Tag</DialogTitle>
          <DialogDescription>Update tag name and color.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Tag name */}
            <div className="space-y-2">
              <Label htmlFor="edit-tag-name">Tag Name</Label>
              <Input
                id="edit-tag-name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Color picker */}
            <div className="space-y-2">
              <Label>Color (Optional)</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(presetColor => (
                  <button
                    key={presetColor}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      color === presetColor ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: presetColor }}
                    onClick={() => setColor(color === presetColor ? undefined : presetColor)}
                    disabled={loading}
                  />
                ))}
              </div>
              {color && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-muted-foreground text-sm">{color}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setColor(undefined)}
                  >
                    Clear
                  </Button>
                </div>
              )}
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
