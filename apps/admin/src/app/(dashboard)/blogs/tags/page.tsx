"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@buildbase/ui/components/ui/button";
import { Tag, Plus, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@buildbase/ui/components/ui/table";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { useAdminDialogManager } from "@/dialogs";
import { API } from "@/services";
import type { BlogTag } from "@/services/blogs";
import { ADMIN_DIALOG_KEYS } from "@/dialogs/constants";

const BlogTagsPage = () => {
  const { openDialog } = useAdminDialogManager();
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    try {
      await API.blogs.tags.remove(id);
      fetchTags();
    } catch (error) {
      console.error("Failed to delete tag:", error);
    }
  };

  const openCreate = () => {
    openDialog(ADMIN_DIALOG_KEYS.CREATE_BLOG_TAG, {
      mode: "create",
      onSaveTag: async data => API.blogs.tags.create(data),
      onSuccess: fetchTags,
    });
  };

  const openEdit = (tag: BlogTag) => {
    openDialog(ADMIN_DIALOG_KEYS.EDIT_BLOG_TAG, {
      mode: "edit",
      tagId: tag.id,
      initialData: { title: tag.title, slug: tag.slug, isPublic: tag.isPublic },
      onSaveTag: async (data, _mode, id) => API.blogs.tags.update(id!, data),
      onSuccess: fetchTags,
    });
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
    </div>
  );
};

export default BlogTagsPage;
