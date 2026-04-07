"use client";

import React, { useState, useEffect } from "react";
import { Save, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@buildbase/ui/components/ui/sheet";
import { Button } from "@buildbase/ui/components/ui/button";
import type { DialogOrSheetBaseProps } from "@buildbase/dialog-manager";

const USERNAME_REGEX = /^[a-z0-9_-]+$/;

export interface BlogAuthorDialogProps extends DialogOrSheetBaseProps {
  mode: "create" | "edit";
  authorId?: string;
  initialData?: { name: string; username: string; image: string; links: string };
  onSaveAuthor: (
    data: { name: string; username: string; image?: string; links?: Record<string, string> },
    mode: "create" | "edit",
    id?: string
  ) => Promise<any>;
  onSuccess?: () => void;
}

export function BlogAuthorDialog({
  open,
  onOpenChange,
  mode,
  authorId,
  initialData,
  onSaveAuthor,
  onSuccess,
}: BlogAuthorDialogProps) {
  const [form, setForm] = useState({ name: "", username: "", image: "", links: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? {
              name: initialData.name,
              username: initialData.username,
              image: initialData.image,
              links: initialData.links,
            }
          : { name: "", username: "", image: "", links: "" }
      );
    }
  }, [open, initialData]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.username.trim()) {
      alert("Name and username are required.");
      return;
    }
    if (!USERNAME_REGEX.test(form.username)) {
      alert("Username can only contain lowercase letters, numbers, hyphens (-), and underscores (_).");
      return;
    }
    let links: Record<string, string> | undefined;
    if (form.links.trim()) {
      try {
        links = JSON.parse(form.links);
      } catch {
        alert('Links must be valid JSON, e.g.: {"twitter": "https://twitter.com/..."}');
        return;
      }
    }
    try {
      setIsSaving(true);
      await onSaveAuthor(
        { name: form.name, username: form.username, image: form.image || undefined, links },
        mode,
        authorId
      );
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to save author:", error);
      const msg = error?.response?.data?.error || error?.message || "Failed to save author.";
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
          <SheetTitle>{mode === "edit" ? "Edit Author" : "Create Author"}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <input
              className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Author name"
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Username *</label>
            <input
              className="focus:ring-ring w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
              placeholder="username"
              maxLength={50}
              pattern="[a-z0-9_-]+"
              title="Only lowercase letters, numbers, hyphens (-), and underscores (_)"
              required
            />
            <p className="text-muted-foreground text-xs">Lowercase letters, numbers, hyphens and underscores only</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Image URL</label>
            <input
              className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              type="url"
              value={form.image}
              onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Links (JSON)</label>
            <textarea
              className="focus:ring-ring w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2"
              rows={4}
              value={form.links}
              onChange={e => setForm(f => ({ ...f, links: e.target.value }))}
              placeholder={'{"twitter": "https://twitter.com/...", "github": "https://github.com/..."}'}
            />
            <p className="text-muted-foreground text-xs">Optional. Valid JSON object mapping label → URL.</p>
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

export default BlogAuthorDialog;
