"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@buildbase/ui/components/ui/button";
import { FolderOpen, Plus, Edit, Trash2, X, Save } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@buildbase/ui/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@buildbase/ui/components/ui/sheet";
import { API } from "@/services";
import type { BlogFolder } from "@/services/blogs";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const BlogFoldersPage = () => {
  const [folders, setFolders] = useState<BlogFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", parentFolderId: "" });

  const fetchFolders = async () => {
    try {
      setIsLoading(true);
      const data = await API.blogs.folders.list({ limit: 1000 });
      setFolders(data.docs || []);
    } catch (error) {
      console.error("Failed to fetch blog folders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [refreshCounter]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", slug: "", parentFolderId: "" });
    setIsSheetOpen(true);
  };

  const openEdit = (folder: BlogFolder) => {
    setEditingId(folder.id);
    setForm({ name: folder.name, slug: folder.slug, parentFolderId: folder.parentFolderId || "" });
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      alert("Name is required.");
      return;
    }
    try {
      setIsSaving(true);
      if (editingId) {
        await API.blogs.folders.update(editingId, {
          name: form.name,
          slug: form.slug || undefined,
          parentFolderId: form.parentFolderId || undefined,
        });
      } else {
        await API.blogs.folders.create({
          name: form.name,
          slug: form.slug || undefined,
          parentFolderId: form.parentFolderId || undefined,
        });
      }
      setIsSheetOpen(false);
      setRefreshCounter(prev => prev + 1);
    } catch (error) {
      console.error("Failed to save folder:", error);
      alert("Failed to save folder.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this folder?")) return;
    try {
      await API.blogs.folders.remove(id);
      setRefreshCounter(prev => prev + 1);
    } catch (error) {
      console.error("Failed to delete folder:", error);
    }
  };

  const parentFolders = folders.filter(f => !editingId || f.id !== editingId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <FolderOpen className="h-5 w-5" />
              Blog Folders
            </h1>
            <p className="text-muted-foreground mt-1">Organize blog posts into folders</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Folder
          </Button>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Loading folders...</div>
        ) : folders.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">No folders found. Create your first folder.</div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {folders.map(folder => (
                  <TableRow key={folder.id}>
                    <TableCell className="font-medium">{folder.name}</TableCell>
                    <TableCell>
                      <code className="text-xs">{folder.slug}</code>
                    </TableCell>
                    <TableCell>
                      <code className="text-muted-foreground text-xs">{folder.path || folder.slug}</code>
                    </TableCell>
                    <TableCell>
                      {folder.parentFolderId ? (
                        folders.find(f => f.id === folder.parentFolderId)?.name || "—"
                      ) : (
                        <span className="text-muted-foreground">Root</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(folder)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(folder.id)}
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
            <SheetTitle>{editingId ? "Edit Folder" : "Create Folder"}</SheetTitle>
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

export default BlogFoldersPage;
