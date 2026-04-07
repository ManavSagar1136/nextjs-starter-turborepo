"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@buildbase/ui/components/ui/button";
import { Users, Plus, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@buildbase/ui/components/ui/table";
import { useAdminDialogManager } from "@/dialogs";
import { API } from "@/services";
import type { BlogAuthor } from "@/services/blogs";
import { ADMIN_DIALOG_KEYS } from "@/dialogs/constants";

const BlogAuthorsPage = () => {
  const { openDialog } = useAdminDialogManager();
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this author?")) return;
    try {
      await API.blogs.authors.remove(id);
      fetchAuthors();
    } catch (error) {
      console.error("Failed to delete author:", error);
    }
  };

  const openCreate = () => {
    openDialog(ADMIN_DIALOG_KEYS.CREATE_BLOG_AUTHOR, {
      mode: "create",
      onSaveAuthor: async data => API.blogs.authors.create(data),
      onSuccess: fetchAuthors,
    });
  };

  const openEdit = (author: BlogAuthor) => {
    openDialog(ADMIN_DIALOG_KEYS.EDIT_BLOG_AUTHOR, {
      mode: "edit",
      authorId: author.id,
      initialData: {
        name: author.name,
        username: author.username,
        image: author.image || "",
        links: author.links ? JSON.stringify(author.links, null, 2) : "",
      },
      onSaveAuthor: async (data, _mode, id) => API.blogs.authors.update(id!, data),
      onSuccess: fetchAuthors,
    });
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
                        // eslint-disable-next-line @next/next/no-img-element
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
    </div>
  );
};

export default BlogAuthorsPage;
