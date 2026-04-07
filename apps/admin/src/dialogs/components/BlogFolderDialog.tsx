"use client";

import React, { useState, useEffect } from "react";
import { Save, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@buildbase/ui/components/ui/sheet";
import { Button } from "@buildbase/ui/components/ui/button";
import type { DialogOrSheetBaseProps } from "@buildbase/dialog-manager";
import type { BlogFolder } from "@/services/blogs";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface BlogFolderDialogProps extends DialogOrSheetBaseProps {
  mode: "create" | "edit";
  folderId?: string;
  initialData?: { name: string; slug: string; parentFolderId: string };
  /** All folders except the one being edited (for parent select) */
  parentFolders: BlogFolder[];
  onSaveFolder: (
    data: { name: string; slug?: string; parentFolderId?: string },
    mode: "create" | "edit",
    id?: string
  ) => Promise<any>;
  onSuccess?: () => void;
}

export function BlogFolderDialog({
  open,
  onOpenChange,
  mode,
  folderId,
  initialData,
  parentFolders,
  onSaveFolder,
  onSuccess,
}: BlogFolderDialogProps) {
  const [form, setForm] = useState({ name: "", slug: "", parentFolderId: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? { name: initialData.name, slug: initialData.slug, parentFolderId: initialData.parentFolderId }
          : { name: "", slug: "", parentFolderId: "" }
      );
    }
  }, [open, initialData]);

  const handleSave = async () => {
    if (!form.name) {
      alert("Name is required.");
      return;
    }
    try {
      setIsSaving(true);
      await onSaveFolder(
        {
          name: form.name,
          slug: form.slug || undefined,
          parentFolderId: form.parentFolderId || undefined,
        },
        mode,
        folderId
      );
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save folder:", error);
      alert("Failed to save folder.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "edit" ? "Edit Folder" : "Create Folder"}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <input
              className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              value={form.name}
              onChange={e =>
                setForm(f => ({ ...f, name: e.target.value, slug: f.slug || generateSlug(e.target.value) }))
              }
              placeholder="Folder name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <input
              className="focus:ring-ring w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="auto-generated"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Parent Folder</label>
            <select
              className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              value={form.parentFolderId}
              onChange={e => setForm(f => ({ ...f, parentFolderId: e.target.value }))}
            >
              <option value="">No parent (root)</option>
              {parentFolders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.path || folder.slug} — {folder.name}
                </option>
              ))}
            </select>
          </div>
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

export default BlogFolderDialog;
