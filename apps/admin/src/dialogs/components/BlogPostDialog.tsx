"use client";

import React, { useState, useEffect } from "react";
import { Save, Image, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@buildbase/ui/components/ui/dialog";
import { Button } from "@buildbase/ui/components/ui/button";
import { Badge } from "@buildbase/ui/components/ui/badge";
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

  // On open: fetch dependencies + post data in edit mode
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
        <DialogContent className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden p-0">
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
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
                {/* Content */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold">Content</h3>

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
                      placeholder="Short description"
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content (Markdown) *</label>
                    <textarea
                      className="focus:ring-ring w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2"
                      rows={14}
                      value={form.content}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      placeholder="Write your post content in Markdown..."
                      required
                    />
                  </div>
                </div>

                {/* Featured Image */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold">Featured Image</h3>

                  {form.image ? (
                    <div className="space-y-3">
                      <div className="bg-muted relative overflow-hidden rounded-lg border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.image}
                          alt={form.imageTitle || "Featured image"}
                          className="max-h-48 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, image: "", imageTitle: "", assetFileId: "" }))}
                          className="bg-destructive absolute right-2 top-2 rounded-full p-1 text-white shadow"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Image Alt Text</label>
                        <input
                          className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                          value={form.imageTitle}
                          onChange={e => setForm(f => ({ ...f, imageTitle: e.target.value }))}
                          placeholder="Describe the image for accessibility"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setIsAssetPickerOpen(true)}
                      >
                        <Image className="mr-2 h-4 w-4" />
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-muted/40 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8">
                        <Image className="text-muted-foreground/50 mb-3 h-8 w-8" />
                        <p className="text-muted-foreground mb-3 text-sm">No image selected</p>
                        <Button type="button" onClick={() => setIsAssetPickerOpen(true)}>
                          <Image className="mr-2 h-4 w-4" />
                          Pick from Library
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Or paste image URL</label>
                        <input
                          className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                          value={form.image}
                          onChange={e => setForm(f => ({ ...f, image: e.target.value, assetFileId: "" }))}
                          placeholder="https://example.com/image.jpg"
                          type="url"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Settings */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold">Settings</h3>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Folder{" "}
                      {isPublished && (
                        <span className="text-muted-foreground text-xs">(locked — post is published)</span>
                      )}
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

                  <div className="flex items-center gap-6">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={form.published}
                        onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                        className="h-4 w-4"
                      />
                      Published
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                        className="h-4 w-4"
                      />
                      Featured
                    </label>
                  </div>
                </div>

                {/* Authors */}
                {authors.length > 0 && (
                  <div className="space-y-3 rounded-lg border p-4">
                    <h3 className="font-semibold">Authors</h3>
                    <div className="flex flex-wrap gap-2">
                      {authors.map(author => (
                        <button
                          key={author.id}
                          type="button"
                          onClick={() => toggleAuthor(author.id)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                            selectedAuthorIds.includes(author.id)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {selectedAuthorIds.includes(author.id) && <X className="h-3 w-3" />}
                          {author.name}
                        </button>
                      ))}
                    </div>
                    {selectedAuthorIds.length > 0 && (
                      <p className="text-muted-foreground text-xs">{selectedAuthorIds.length} author(s) selected</p>
                    )}
                  </div>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="space-y-3 rounded-lg border p-4">
                    <h3 className="font-semibold">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                            selectedTagIds.includes(tag.id)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {selectedTagIds.includes(tag.id) && <X className="h-3 w-3" />}
                          {tag.title}
                        </button>
                      ))}
                    </div>
                    {selectedTagIds.length > 0 && (
                      <p className="text-muted-foreground text-xs">{selectedTagIds.length} tag(s) selected</p>
                    )}
                  </div>
                )}

                {/* SEO */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold">SEO</h3>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">SEO Title</label>
                    <input
                      className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      value={form.seoTitle}
                      onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))}
                      placeholder="Defaults to post title"
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
