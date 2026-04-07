"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@buildbase/ui/components/ui/button";
import { FileText, Plus, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@buildbase/ui/components/ui/table";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { useAdminDialogManager } from "@/dialogs";
import { API } from "@/services";
import type { BlogPost } from "@/services/blogs";
import { ADMIN_DIALOG_KEYS } from "@/dialogs/constants";

const BlogPostsPage = () => {
  const { openDialog } = useAdminDialogManager();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const data = await API.blogs.posts.list({ limit: 100 });
      setPosts(data.docs || []);
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    try {
      await API.blogs.posts.remove(id);
      fetchPosts();
    } catch (error) {
      console.error("Failed to delete blog post:", error);
    }
  };

  const openCreate = () => {
    openDialog(ADMIN_DIALOG_KEYS.CREATE_BLOG_POST, {
      mode: "create",
      onSavePost: async (data: any) => API.blogs.posts.create(data),
      onUpdateTags: (id: string, tagIds: string[]) => API.blogs.posts.updateTags(id, tagIds),
      onUpdateAuthors: (id: string, authorIds: string[]) => API.blogs.posts.updateAuthors(id, authorIds),
      onSuccess: fetchPosts,
    });
  };

  const openEdit = (post: BlogPost) => {
    openDialog(ADMIN_DIALOG_KEYS.EDIT_BLOG_POST, {
      mode: "edit",
      postId: post.id,
      onFetchPost: (id: string) => API.blogs.posts.getById(id),
      onSavePost: async (data: any, _mode: string, id?: string) => API.blogs.posts.update(id!, data),
      onUpdateTags: (id: string, tagIds: string[]) => API.blogs.posts.updateTags(id, tagIds),
      onUpdateAuthors: (id: string, authorIds: string[]) => API.blogs.posts.updateAuthors(id, authorIds),
      onSuccess: fetchPosts,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <FileText className="h-5 w-5" />
              Blog Posts
            </h1>
            <p className="text-muted-foreground mt-1">Manage blog posts and their content</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Loading blog posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No blog posts found. Create your first post to get started.
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Folder</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Featured</TableHead>
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
                      <Badge variant={post.published ? "default" : "secondary"}>
                        {post.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>{post.featured && <Badge variant="outline">Featured</Badge>}</TableCell>
                    <TableCell>
                      {post.createdAt && (
                        <span className="text-muted-foreground text-sm">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      )}
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

export default BlogPostsPage;
