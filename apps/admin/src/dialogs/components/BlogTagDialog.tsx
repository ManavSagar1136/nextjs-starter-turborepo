"use client";

import React, { useState, useEffect } from "react";
import { Save, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@buildbase/ui/components/ui/sheet";
import { Button } from "@buildbase/ui/components/ui/button";
import type { DialogOrSheetBaseProps } from "@buildbase/dialog-manager";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface BlogTagDialogProps extends DialogOrSheetBaseProps {
  mode: "create" | "edit";
  tagId?: string;
  initialData?: { title: string; slug: string; isPublic: boolean };
  onSaveTag: (
    data: { title: string; slug?: string; isPublic: boolean },
    mode: "create" | "edit",
    id?: string
  ) => Promise<any>;
  onSuccess?: () => void;
}

export function BlogTagDialog({
  open,
  onOpenChange,
  mode,
  tagId,
  initialData,
  onSaveTag,
  onSuccess,
}: BlogTagDialogProps) {
  const [form, setForm] = useState({ title: "", slug: "", isPublic: true });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? { title: initialData.title, slug: initialData.slug, isPublic: initialData.isPublic }
          : { title: "", slug: "", isPublic: true }
      );
    }
  }, [open, initialData]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert("Title is required.");
      return;
    }
    try {
      setIsSaving(true);
      await onSaveTag({ title: form.title, slug: form.slug || undefined, isPublic: form.isPublic }, mode, tagId);
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to save tag:", error);
      const msg = error?.response?.data?.error || error?.message || "Failed to save tag.";
      const details = error?.response?.data?.details;
      alert(details ? `${msg}\n\n${details.map((d: any) => d.message).join("\n")}` : msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "edit" ? "Edit Tag" : "Create Tag"}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <input
              className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              value={form.title}
              onChange={e =>
                setForm(f => ({ ...f, title: e.target.value, slug: f.slug || generateSlug(e.target.value) }))
              }
              placeholder="Tag title"
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <input
              className="focus:ring-ring w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="auto-generated"
              maxLength={100}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))}
              className="h-4 w-4"
            />
            Public (visible on public site)
          </label>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default BlogTagDialog;
