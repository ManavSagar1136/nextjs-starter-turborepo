"use client";

import React, { useState, useEffect } from "react";
import { Save, Image, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@buildbase/ui/components/ui/dialog";
import { Button } from "@buildbase/ui/components/ui/button";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { Switch } from "@buildbase/ui/components/ui/ui-switch";
import { API } from "@/services";
import type { BlogFolder, BlogTag, BlogAuthor } from "@/services/blogs";
import { AssetPickerDialog } from "@/components/assets/AssetPickerDialog";
import type { IAsset } from "@buildbase/components/media-library";
import type { DialogOrSheetBaseProps } from "@buildbase/dialog-manager";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface BlogPostDialogProps extends DialogOrSheetBaseProps {
  mode: "create" | "edit";
  postId?: string;
  initialData?: {
    title: string;
    slug: string;
    description: string;
    excerpt: string;
    content: string;
    image: string;
    imageTitle: string;
    assetFileId: string;
    folderId: string;
    published: boolean;
    featured: boolean;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    tagIds: string[];
    authorIds: string[];
  };
  onFetchPost?: (id: string) => Promise<any>;
  onSavePost: (data: any, mode: "create" | "edit", id?: string) => Promise<any>;
  onUpdateTags?: (id: string, tagIds: string[]) => Promise<any>;
  onUpdateAuthors?: (id: string, authorIds: string[]) => Promise<any>;
  onSuccess?: () => void;
}

export function BlogPostDialog({
  open,
  onOpenChange,
  mode,
  postId,
  initialData,
  onFetchPost,
  onSavePost,
  onUpdateTags,
  onUpdateAuthors,
  onSuccess,
}: BlogPostDialogProps) {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    excerpt: "",
    content: "",
    image: "",
    imageTitle: "",
    assetFileId: "",
    folderId: "",
    published: false,
    featured: false,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<string[]>([]);
  const [folders, setFolders] = useState<BlogFolder[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    Promise.all([
      API.blogs.folders.list({ limit: 1000 }),
      API.blogs.tags.list({ limit: 1000 }),
      API.blogs.authors.list({ limit: 1000 }),
    ]).then(([foldersRes, tagsRes, authorsRes]) => {
      setFolders(foldersRes.docs || []);
      setTags(tagsRes.docs || []);
      setAuthors(authorsRes.docs || []);
    });

    if (mode === "edit" && postId && onFetchPost) {
      setIsLoadingData(true);
      onFetchPost(postId)
        .then((post: any) => {
          setForm({
            title: post.title || "",
            slug: post.slug || "",
            description: post.description || "",
            excerpt: post.excerpt || "",
            content: post.content || "",
            image: post.image || "",
            imageTitle: post.imageTitle || "",
            assetFileId: post.assetFileId || "",
            folderId: post.folderId || post.folder?.id || "",
            published: post.published || false,
            featured: post.featured || false,
            seoTitle: post.seoTitle || "",
            seoDescription: post.seoDescription || "",
            seoKeywords: Array.isArray(post.seoKeywords) ? post.seoKeywords.join(", ") : post.seoKeywords || "",
          });
          setSelectedTagIds((post.tags || []).map((t: any) => t.tag?.id || t.tagId).filter(Boolean));
          setSelectedAuthorIds((post.authors || []).map((a: any) => a.author?.id || a.authorId).filter(Boolean));
        })
        .catch(err => console.error("Failed to fetch post:", err))
        .finally(() => setIsLoadingData(false));
    } else if (mode === "create") {
      if (initialData) {
        setForm({
          title: initialData.title,
          slug: initialData.slug,
          description: initialData.description,
          excerpt: initialData.excerpt,
          content: initialData.content,
          image: initialData.image,
          imageTitle: initialData.imageTitle,
          assetFileId: initialData.assetFileId,
          folderId: initialData.folderId,
          published: initialData.published,
          featured: initialData.featured,
          seoTitle: initialData.seoTitle,
          seoDescription: initialData.seoDescription,
          seoKeywords: initialData.seoKeywords,
        });
        setSelectedTagIds(initialData.tagIds || []);
        setSelectedAuthorIds(initialData.authorIds || []);
      } else {
        setForm({
          title: "",
          slug: "",
          description: "",
          excerpt: "",
          content: "",
          image: "",
          imageTitle: "",
          assetFileId: "",
          folderId: "",
          published: false,
          featured: false,
          seoTitle: "",
          seoDescription: "",
          seoKeywords: "",
        });
        setSelectedTagIds([]);
        setSelectedAuthorIds([]);
      }
    }
  }, [open, mode, postId]);

  const handleTitleChange = (title: string) => {
    setForm(f => ({ ...f, title, slug: f.slug || generateSlug(title) }));
  };

  const handleAssetSelect = (asset: IAsset) => {
    setForm(f => ({
      ...f,
      image: asset.url,
      imageTitle: asset.filename || asset.name || "",
      assetFileId: asset.id,
    }));
  };

  const toggleTag = (id: string) =>
    setSelectedTagIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const toggleAuthor = (id: string) =>
    setSelectedAuthorIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.content) {
      alert("Title, description, and content are required.");
      return;
    }
    try {
      setIsSaving(true);
      const post = await onSavePost(
        {
          title: form.title,
          slug: form.slug || generateSlug(form.title),
          description: form.description,
          excerpt: form.excerpt || undefined,
          content: form.content,
          image: form.image || undefined,
          imageTitle: form.imageTitle || undefined,
          assetFileId: form.assetFileId || undefined,
          folderId: form.folderId || undefined,
          published: form.published,
          featured: form.featured,
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

      const id = mode === "create" ? post?.id : postId;
      if (id) {
        await Promise.all([
          onUpdateTags ? onUpdateTags(id, selectedTagIds) : Promise.resolve(),
          onUpdateAuthors ? onUpdateAuthors(id, selectedAuthorIds) : Promise.resolve(),
        ]);
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to save blog post:", error);
      const msg = error?.response?.data?.error || error?.message || "Failed to save blog post.";
      const details = error?.response?.data?.details;
      alert(details ? `${msg}\n\n${details.map((d: any) => d.message).join("\n")}` : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const isPublished = mode === "edit" && form.published;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden p-0">
          {/* Header */}
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <DialogTitle>{mode === "edit" ? "Edit Blog Post" : "New Blog Post"}</DialogTitle>
              {mode === "edit" && form.published && <Badge>Published</Badge>}
              {mode === "edit" && form.featured && <Badge variant="outline">Featured</Badge>}
            </div>
          </DialogHeader>

          {isLoadingData ? (
            <div className="text-muted-foreground flex flex-1 items-center justify-center">Loading post...</div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
              {/* Two-column body */}
              <div className="flex flex-1 overflow-hidden">
                {/* ── Left: main content ── */}
                <div className="flex flex-1 flex-col space-y-4 overflow-y-auto border-r px-6 py-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title *</label>
                    <input
                      className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      value={form.title}
                      onChange={e => handleTitleChange(e.target.value)}
                      placeholder="Post title"
                      maxLength={200}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Slug{" "}
                      {isPublished && (
                        <span className="text-muted-foreground text-xs">(locked — post is published)</span>
                      )}
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
                    <label className="text-sm font-medium">Description *</label>
                    <textarea
                      className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      rows={2}
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Short description shown in post cards and meta tags"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Excerpt</label>
                    <textarea
                      className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      rows={2}
                      value={form.excerpt}
                      onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                      placeholder="Optional excerpt (appears in post cards)"
                      maxLength={1000}
                    />
                  </div>

                  <div className="flex flex-1 flex-col space-y-2">
                    <label className="text-sm font-medium">Content (Markdown) *</label>
                    <textarea
                      className="focus:ring-ring w-full flex-1 rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2"
                      style={{ minHeight: "320px", resize: "vertical" }}
                      value={form.content}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      placeholder="Write your post content in Markdown..."
                      required
                    />
                  </div>
                </div>

                {/* ── Right: metadata sidebar ── */}
                <div className="w-80 shrink-0 space-y-5 overflow-y-auto px-5 py-5">
                  {/* Publish controls */}
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Visibility</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium">Published</p>
                          <p className="text-muted-foreground text-xs">Visible on the public site</p>
                        </div>
                        <Switch
                          checked={form.published}
                          onCheckedChange={v => setForm(f => ({ ...f, published: v }))}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium">Featured</p>
                          <p className="text-muted-foreground text-xs">Highlight in featured sections</p>
                        </div>
                        <Switch checked={form.featured} onCheckedChange={v => setForm(f => ({ ...f, featured: v }))} />
                      </div>
                    </div>
                  </div>

                  {/* Folder */}
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                      Folder{" "}
                      {isPublished && (
                        <span className="text-muted-foreground text-xs font-normal normal-case">(locked)</span>
                      )}
                    </p>
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

                  {/* Featured Image */}
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                      Featured Image
                    </p>
                    {form.image ? (
                      <div className="space-y-2">
                        <div className="bg-muted relative overflow-hidden rounded-lg border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={form.image}
                            alt={form.imageTitle || "Featured image"}
                            className="max-h-36 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, image: "", imageTitle: "", assetFileId: "" }))}
                            className="bg-destructive absolute right-2 top-2 rounded-full p-1 text-white shadow"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <input
                          className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                          value={form.imageTitle}
                          onChange={e => setForm(f => ({ ...f, imageTitle: e.target.value }))}
                          placeholder="Alt text for accessibility"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setIsAssetPickerOpen(true)}
                        >
                          <Image className="mr-2 h-3.5 w-3.5" />
                          Change Image
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div
                          className="bg-muted/40 hover:bg-muted/60 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition-colors"
                          onClick={() => setIsAssetPickerOpen(true)}
                        >
                          <Image className="text-muted-foreground/50 mb-2 h-7 w-7" />
                          <p className="text-muted-foreground text-xs">Click to pick from library</p>
                        </div>
                        <input
                          className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                          value={form.image}
                          onChange={e => setForm(f => ({ ...f, image: e.target.value, assetFileId: "" }))}
                          placeholder="Or paste image URL…"
                          type="url"
                        />
                      </div>
                    )}
                  </div>

                  {/* Authors */}
                  {authors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                        Authors{selectedAuthorIds.length > 0 && ` · ${selectedAuthorIds.length} selected`}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {authors.map(author => (
                          <button
                            key={author.id}
                            type="button"
                            onClick={() => toggleAuthor(author.id)}
                            className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                              selectedAuthorIds.includes(author.id)
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {selectedAuthorIds.includes(author.id) && <X className="h-2.5 w-2.5" />}
                            {author.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                        Tags{selectedTagIds.length > 0 && ` · ${selectedTagIds.length} selected`}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map(tag => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                              selectedTagIds.includes(tag.id)
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {selectedTagIds.includes(tag.id) && <X className="h-2.5 w-2.5" />}
                            {tag.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SEO */}
                  <div className="space-y-3">
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">SEO</p>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Title</label>
                      <input
                        className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                        value={form.seoTitle}
                        onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))}
                        placeholder="Defaults to post title"
                        maxLength={200}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Description</label>
                      <textarea
                        className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                        rows={2}
                        value={form.seoDescription}
                        onChange={e => setForm(f => ({ ...f, seoDescription: e.target.value }))}
                        placeholder="Meta description"
                        maxLength={500}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Keywords</label>
                      <input
                        className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                        value={form.seoKeywords}
                        onChange={e => setForm(f => ({ ...f, seoKeywords: e.target.value }))}
                        placeholder="keyword1, keyword2"
                      />
                    </div>
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
                  {isSaving ? "Saving..." : "Save Post"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AssetPickerDialog
        open={isAssetPickerOpen}
        onOpenChange={setIsAssetPickerOpen}
        onSelect={handleAssetSelect}
        title="Select Featured Image"
      />
    </>
  );
}

export default BlogPostDialog;
