"use client";

import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@buildbase/ui/components/ui/dialog";
import { Button } from "@buildbase/ui/components/ui/button";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { API } from "@/services";
import type { DocFolder } from "@/services/docs";
import type { DialogOrSheetBaseProps } from "@buildbase/dialog-manager";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface DocPostDialogProps extends DialogOrSheetBaseProps {
  mode: "create" | "edit";
  postId?: string;
  initialData?: {
    title: string;
    slug: string;
    subtitle: string;
    description: string;
    content: string;
    folderId: string;
    order: string;
    published: boolean;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
  };
  onFetchPost?: (id: string) => Promise<any>;
  onSavePost: (data: any, mode: "create" | "edit", id?: string) => Promise<any>;
  onSuccess?: () => void;
}

export function DocPostDialog({
  open,
  onOpenChange,
  mode,
  postId,
  initialData,
  onFetchPost,
  onSavePost,
  onSuccess,
}: DocPostDialogProps) {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    subtitle: "",
    description: "",
    content: "",
    folderId: "",
    order: "",
    published: false,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (!open) return;

    API.docs.folders.list({ limit: 1000 }).then(res => setFolders(res.docs || []));

    if (mode === "edit" && postId && onFetchPost) {
      setIsLoadingData(true);
      onFetchPost(postId)
        .then((post: any) => {
          setForm({
            title: post.title || "",
            slug: post.slug || "",
            subtitle: post.subtitle || "",
            description: post.description || "",
            content: post.content || "",
            folderId: post.folderId || post.folder?.id || "",
            order: post.order != null ? String(post.order) : "",
            published: post.published || false,
            seoTitle: post.seoTitle || "",
            seoDescription: post.seoDescription || "",
            seoKeywords: Array.isArray(post.seoKeywords) ? post.seoKeywords.join(", ") : post.seoKeywords || "",
          });
        })
        .catch(err => console.error("Failed to fetch doc post:", err))
        .finally(() => setIsLoadingData(false));
    } else if (mode === "create") {
      setForm(
        initialData ?? {
          title: "",
          slug: "",
          subtitle: "",
          description: "",
          content: "",
          folderId: "",
          order: "",
          published: false,
          seoTitle: "",
          seoDescription: "",
          seoKeywords: "",
        }
      );
    }
  }, [open, mode, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      alert("Title and content are required.");
      return;
    }
    try {
      setIsSaving(true);
      await onSavePost(
        {
          title: form.title,
          slug: form.slug || generateSlug(form.title),
          subtitle: form.subtitle || undefined,
          description: form.description || undefined,
          content: form.content,
          folderId: form.folderId || undefined,
          order: form.order ? parseInt(form.order, 10) : undefined,
          published: form.published,
          seoTitle: form.seoTitle || undefined,
          seoDescription: form.seoDescription || undefined,
          seoKeywords: form.seoKeywords
            ? form.seoKeywords
                .split(",")
                .map(k => k.trim())
                .filter(Boolean)
            : [],
        },
        mode,
        postId
      );
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to save doc post:", error);
      const msg = error?.response?.data?.error || error?.message || "Failed to save doc.";
      const details = error?.response?.data?.details;
      alert(details ? `${msg}\n\n${details.map((d: any) => d.message).join("\n")}` : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const isPublished = mode === "edit" && form.published;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <DialogTitle>{mode === "edit" ? "Edit Doc" : "New Doc"}</DialogTitle>
            {mode === "edit" && form.published && <Badge>Published</Badge>}
          </div>
        </DialogHeader>

        {isLoadingData ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center">Loading doc...</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
              {/* Content */}
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold">Content</h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Title *</label>
                  <input
                    className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    value={form.title}
                    onChange={e =>
                      setForm(f => ({ ...f, title: e.target.value, slug: f.slug || generateSlug(e.target.value) }))
                    }
                    placeholder="Doc title"
                    maxLength={200}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Slug{" "}
                    {isPublished && <span className="text-muted-foreground text-xs">(locked — doc is published)</span>}
                  </label>
                  <input
                    className="focus:ring-ring w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="auto-generated-from-title"
                    maxLength={200}
                    disabled={isPublished}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Subtitle</label>
                  <input
                    className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    value={form.subtitle}
                    onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                    placeholder="Optional subtitle"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    rows={2}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Short description"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Content (Markdown) *</label>
                  <textarea
                    className="focus:ring-ring w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2"
                    rows={14}
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Write your doc in Markdown..."
                    required
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold">Settings</h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Folder{" "}
                    {isPublished && <span className="text-muted-foreground text-xs">(locked — doc is published)</span>}
                  </label>
                  <select
                    className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                    value={form.folderId}
                    onChange={e => setForm(f => ({ ...f, folderId: e.target.value }))}
                    disabled={isPublished}
                  >
                    <option value="">No folder (root)</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {folder.path || folder.slug} — {folder.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Order</label>
                  <input
                    type="number"
                    className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    value={form.order}
                    onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
                    placeholder="Sort order (optional)"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  Published
                </label>
              </div>

              {/* SEO */}
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold">SEO</h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium">SEO Title</label>
                  <input
                    className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    value={form.seoTitle}
                    onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))}
                    placeholder="Defaults to doc title"
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">SEO Description</label>
                  <textarea
                    className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    rows={2}
                    value={form.seoDescription}
                    onChange={e => setForm(f => ({ ...f, seoDescription: e.target.value }))}
                    placeholder="SEO meta description"
                    maxLength={500}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">SEO Keywords</label>
                  <input
                    className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    value={form.seoKeywords}
                    onChange={e => setForm(f => ({ ...f, seoKeywords: e.target.value }))}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                  <p className="text-muted-foreground text-xs">Comma-separated keywords</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 justify-end gap-3 border-t px-6 py-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Doc"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default DocPostDialog;
