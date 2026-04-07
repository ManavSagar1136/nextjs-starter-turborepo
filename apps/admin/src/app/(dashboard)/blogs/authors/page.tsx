"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@buildbase/ui/components/ui/button";
import { Users, Plus, Edit, Trash2, X, Save } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@buildbase/ui/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@buildbase/ui/components/ui/sheet";
import { API } from "@/services";
import type { BlogAuthor } from "@/services/blogs";

const BlogAuthorsPage = () => {
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", image: "", links: "" });

  const fetchAuthors = async () => {
    try {
      setIsLoading(true);
      const data = await API.blogs.authors.list({ limit: 1000 });
      setAuthors(data.docs || []);
    } catch (error) {
      console.error("Failed to fetch blog authors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, [refreshCounter]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", username: "", image: "", links: "" });
    setIsSheetOpen(true);
  };

  const openEdit = (author: BlogAuthor) => {
    setEditingId(author.id);
    setForm({
      name: author.name,
      username: author.username,
      image: author.image || "",
      links: author.links ? JSON.stringify(author.links, null, 2) : "",
    });
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.username) {
      alert("Name and username are required.");
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
      if (editingId) {
        await API.blogs.authors.update(editingId, {
          name: form.name,
          username: form.username,
          image: form.image || undefined,
          links,
        });
      } else {
        await API.blogs.authors.create({
          name: form.name,
          username: form.username,
          image: form.image || undefined,
          links,
        });
      }
      setIsSheetOpen(false);
      setRefreshCounter(prev => prev + 1);
    } catch (error) {
      console.error("Failed to save author:", error);
      alert("Failed to save author.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this author?")) return;
    try {
      await API.blogs.authors.remove(id);
      setRefreshCounter(prev => prev + 1);
    } catch (error) {
      console.error("Failed to delete author:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Users className="h-5 w-5" />
              Blog Authors
            </h1>
            <p className="text-muted-foreground mt-1">Manage blog post authors</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Author
          </Button>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Loading authors...</div>
        ) : authors.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">No authors found. Create your first author.</div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authors.map(author => (
                  <TableRow key={author.id}>
                    <TableCell className="font-medium">{author.name}</TableCell>
                    <TableCell>
                      <code className="text-xs">@{author.username}</code>
                    </TableCell>
                    <TableCell>
                      {author.image ? (
                        <img src={author.image} alt={author.name} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(author)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(author.id)}
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
            <SheetTitle>{editingId ? "Edit Author" : "Create Author"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <input
                className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Author name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Username *</label>
              <input
                className="focus:ring-ring w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Image URL</label>
              <input
                className="focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
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

export default BlogAuthorsPage;
