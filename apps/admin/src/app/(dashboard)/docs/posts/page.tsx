"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@buildbase/ui/components/ui/button";
import { BookOpen, Plus, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@buildbase/ui/components/ui/table";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { useAdminDialogManager } from "@/dialogs";
import { API } from "@/services";
import type { DocPost } from "@/services/docs";
import { ADMIN_DIALOG_KEYS } from "@/dialogs/constants";

const DocPostsPage = () => {
  const { openDialog } = useAdminDialogManager();
  const [posts, setPosts] = useState<DocPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const data = await API.docs.posts.list({ limit: 100 });
      setPosts(data.docs || []);
    } catch (error) {
      console.error("Failed to fetch doc posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this doc?")) return;
    try {
      await API.docs.posts.remove(id);
      fetchPosts();
    } catch (error) {
      console.error("Failed to delete doc post:", error);
    }
  };

  const openCreate = () => {
    openDialog(ADMIN_DIALOG_KEYS.CREATE_DOC_POST, {
      mode: "create",
      onSavePost: async (data: any) => API.docs.posts.create(data),
      onSuccess: fetchPosts,
    });
  };

  const openEdit = (post: DocPost) => {
    openDialog(ADMIN_DIALOG_KEYS.EDIT_DOC_POST, {
      mode: "edit",
      postId: post.id,
      onFetchPost: (id: string) => API.docs.posts.getById(id),
      onSavePost: async (data: any, _mode: string, id?: string) => API.docs.posts.update(id!, data),
      onSuccess: fetchPosts,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <BookOpen className="h-5 w-5" />
              Doc Posts
            </h1>
            <p className="text-muted-foreground mt-1">Manage documentation pages</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Doc
          </Button>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Loading docs...</div>
        ) : posts.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No docs found. Create your first doc to get started.
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Folder</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map(post => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-xs truncate font-medium">{post.title}</TableCell>
                    <TableCell>
                      <code className="text-xs">{post.slug}</code>
                    </TableCell>
                    <TableCell>{post.folder?.name || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      {post.order != null ? (
                        <span className="text-sm">{post.order}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.published ? "default" : "secondary"}>
                        {post.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {post.createdAt && new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(post)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                          className="text-destructive hover:text-destructive"
                          title="Delete"
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

export default DocPostsPage;
