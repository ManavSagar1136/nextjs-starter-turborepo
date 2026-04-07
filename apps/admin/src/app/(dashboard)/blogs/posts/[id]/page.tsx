"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@buildbase/ui/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { API } from "@/services";
import type { BlogPost, BlogFolder } from "@/services/blogs";
import { Routes } from "@/data/routes";

const EditBlogPostPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [folders, setFolders] = useState<BlogFolder[]>([]);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    excerpt: "",
    content: "",
    folderId: "",
    published: false,
    featured: false,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });

  useEffect(() => {
    Promise.all([API.blogs.posts.getById(id), API.blogs.folders.list({ limit: 1000 })])
      .then(([postData, foldersData]) => {
        setPost(postData);
        setFolders(foldersData.docs || []);
        setForm({
          title: postData.title,
          slug: postData.slug,
          description: postData.description,
          excerpt: postData.excerpt || "",
          content: postData.content,
          folderId: postData.folderId || "",
          published: postData.published,
          featured: postData.featured,
          seoTitle: postData.seoTitle || "",
          seoDescription: postData.seoDescription || "",
          seoKeywords: (postData.seoKeywords || []).join(", "),
        });
      })
      .catch(err => {
        console.error("Failed to load blog post:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.content) {
      alert("Title, description, and content are required.");
      return;
    }
    try {
      setIsSaving(true);
      await API.blogs.posts.update(id, {
        title: form.title,
        slug: form.slug,
        description: form.description,
        excerpt: form.excerpt || undefined,
        content: form.content,
        folderId: form.folderId || undefined,
        published: form.published,
        featured: form.featured,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
        seoKeywords: form.seoKeywords ? (form.seoKeywords.split(",").map(k => k.trim()) as any) : [],
      });
      router.push(Routes.blogs.posts);
    } catch (error) {
      console.error("Failed to update blog post:", error);
      alert("Failed to update blog post.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground py-8 text-center">Loading...</div>;
  }

  if (!post) {
    return <div className="text-muted-foreground py-8 text-center">Blog post not found.</div>;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(Routes.blogs.posts)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Blog Post</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Content</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <input
              className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Post title"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <input
              className="focus:ring-ring w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description *</label>
            <textarea
              className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
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
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Content (Markdown) *</label>
            <textarea
              className="focus:ring-ring w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2"
              rows={16}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Settings</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium">Folder</label>
            <select
              className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              value={form.folderId}
              onChange={e => setForm(f => ({ ...f, folderId: e.target.value }))}
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

        <div className="space-y-4 rounded-lg border p-6">
          <h2 className="text-lg font-semibold">SEO</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium">SEO Title</label>
            <input
              className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              value={form.seoTitle}
              onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))}
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

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(Routes.blogs.posts)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditBlogPostPage;
