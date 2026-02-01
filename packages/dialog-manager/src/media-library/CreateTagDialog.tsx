"use client";

import { useEffect, useState } from "react";

import { Button } from "@buildbase/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";
import { Input } from "@buildbase/ui/input";
import { Label } from "@buildbase/ui/label";

import type { CreateTagDialogProps } from "./types";

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

export function CreateTagDialog({ open, onOpenChange, isLoading = false, onCreateTag }: CreateTagDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setName("");
      setColor(undefined);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isPending) return;

    setIsPending(true);
    try {
      await onCreateTag({
        name: name.trim(),
        color: color || undefined,
      });
      setName("");
      setColor(undefined);
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
          <DialogTitle>Create Tag</DialogTitle>
          <DialogDescription>Create a new tag to organize your assets.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Tag name */}
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Featured, Archive, Draft"
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
            <Button type="submit" disabled={!name.trim() || loading}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
