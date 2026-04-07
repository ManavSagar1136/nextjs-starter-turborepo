"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@buildbase/ui/components/ui/button";
import { History, Plus, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@buildbase/ui/components/ui/table";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { useAdminDialogManager } from "@/dialogs";
import { API } from "@/services";
import type { ChangelogPost } from "@/services/changelogs";
import { ADMIN_DIALOG_KEYS } from "@/dialogs/constants";

const ChangelogPostsPage = () => {
  const { openDialog } = useAdminDialogManager();
  const [posts, setPosts] = useState<ChangelogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const data = await API.changelogs.posts.list({ limit: 100 });
      setPosts(data.docs || []);
    } catch (error) {
      console.error("Failed to fetch changelog posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (post: ChangelogPost) => {
    if (post.published) {
      alert("Cannot delete a published changelog. Unpublish it first.");
      return;
    }
    if (!confirm(`Are you sure you want to delete "${post.title}" (v${post.version})?`)) return;
    try {
      await API.changelogs.posts.remove(post.id);
      fetchPosts();
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || "Failed to delete changelog.";
      alert(msg);
    }
  };

  const openCreate = () => {
    openDialog(ADMIN_DIALOG_KEYS.CREATE_CHANGELOG_POST, {
      mode: "create",
      onSavePost: async (data: any) => API.changelogs.posts.create(data),
      onSuccess: fetchPosts,
    });
  };

  const openEdit = (post: ChangelogPost) => {
    openDialog(ADMIN_DIALOG_KEYS.EDIT_CHANGELOG_POST, {
      mode: "edit",
      postId: post.id,
      onFetchPost: (id: string) => API.changelogs.posts.getById(id),
      onSavePost: async (data: any, _mode: string, id?: string) => API.changelogs.posts.update(id!, data),
      onSuccess: fetchPosts,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <History className="h-5 w-5" />
              Changelogs
            </h1>
            <p className="text-muted-foreground mt-1">Manage product release notes</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Changelog
          </Button>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Loading changelogs...</div>
        ) : posts.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No changelogs found. Create your first changelog to get started.
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map(post => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-xs truncate font-medium">{post.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        v{post.version}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{post.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.published ? "default" : "secondary"}>
                        {post.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {post.releaseDate
                          ? new Date(post.releaseDate).toLocaleDateString()
                          : post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString()
                            : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {new Date(post.createdAt).toLocaleDateString()}
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
                          onClick={() => handleDelete(post)}
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                          disabled={post.published}
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

export default ChangelogPostsPage;
