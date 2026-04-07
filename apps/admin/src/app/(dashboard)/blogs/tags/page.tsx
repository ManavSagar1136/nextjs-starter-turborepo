"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@buildbase/ui/components/ui/button";
import { Tag, Plus, Edit, Trash2, X, Save } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@buildbase/ui/components/ui/table";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@buildbase/ui/components/ui/sheet";
import { API } from "@/services";
import type { BlogTag } from "@/services/blogs";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const BlogTagsPage = () => {
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", isPublic: true });

  const fetchTags = async () => {
    try {
      setIsLoading(true);
      const data = await API.blogs.tags.list({ limit: 1000 });
      setTags(data.docs || []);
    } catch (error) {
      console.error("Failed to fetch blog tags:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [refreshCounter]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: "", slug: "", isPublic: true });
    setIsSheetOpen(true);
  };

  const openEdit = (tag: BlogTag) => {
    setEditingId(tag.id);
    setForm({ title: tag.title, slug: tag.slug, isPublic: tag.isPublic });
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) {
      alert("Title is required.");
      return;
    }
    try {
      setIsSaving(true);
      if (editingId) {
        await API.blogs.tags.update(editingId, {
          title: form.title,
          slug: form.slug || undefined,
          isPublic: form.isPublic,
        });
      } else {
        await API.blogs.tags.create({ title: form.title, slug: form.slug || undefined, isPublic: form.isPublic });
      }
      setIsSheetOpen(false);
      setRefreshCounter(prev => prev + 1);
    } catch (error) {
      console.error("Failed to save tag:", error);
      alert("Failed to save tag.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    try {
      await API.blogs.tags.remove(id);
      setRefreshCounter(prev => prev + 1);
    } catch (error) {
      console.error("Failed to delete tag:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Tag className="h-5 w-5" />
              Blog Tags
            </h1>
            <p className="text-muted-foreground mt-1">Manage tags for blog posts</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Tag
          </Button>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Loading tags...</div>
        ) : tags.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">No tags found. Create your first tag.</div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map(tag => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{tag.title}</TableCell>
                    <TableCell>
                      <code className="text-xs">{tag.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tag.isPublic ? "default" : "secondary"}>
                        {tag.isPublic ? "Public" : "Private"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {tag.createdAt && new Date(tag.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(tag)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tag.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit Tag" : "Create Tag"}</SheetTitle>
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
              <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default BlogTagsPage;
