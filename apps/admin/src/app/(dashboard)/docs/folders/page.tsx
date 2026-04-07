"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@buildbase/ui/components/ui/button";
import { FolderOpen, Plus, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@buildbase/ui/components/ui/table";
import { useAdminDialogManager } from "@/dialogs";
import { API } from "@/services";
import type { DocFolder } from "@/services/docs";
import { ADMIN_DIALOG_KEYS } from "@/dialogs/constants";

const DocFoldersPage = () => {
  const { openDialog } = useAdminDialogManager();
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFolders = async () => {
    try {
      setIsLoading(true);
      const data = await API.docs.folders.list({ limit: 1000 });
      setFolders(data.docs || []);
    } catch (error) {
      console.error("Failed to fetch doc folders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this folder?")) return;
    try {
      await API.docs.folders.remove(id);
      fetchFolders();
    } catch (error) {
      console.error("Failed to delete folder:", error);
    }
  };

  const openCreate = () => {
    openDialog(ADMIN_DIALOG_KEYS.CREATE_DOC_FOLDER, {
      mode: "create",
      parentFolders: folders,
      onSaveFolder: async data => API.docs.folders.create(data),
      onSuccess: fetchFolders,
    });
  };

  const openEdit = (folder: DocFolder) => {
    openDialog(ADMIN_DIALOG_KEYS.EDIT_DOC_FOLDER, {
      mode: "edit",
      folderId: folder.id,
      initialData: { name: folder.name, slug: folder.slug, parentFolderId: folder.parentFolderId || "" },
      parentFolders: folders.filter(f => f.id !== folder.id),
      onSaveFolder: async (data, _mode, id) => API.docs.folders.update(id!, data),
      onSuccess: fetchFolders,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <FolderOpen className="h-5 w-5" />
              Doc Folders
            </h1>
            <p className="text-muted-foreground mt-1">Organize documentation into folders</p>
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
    </div>
  );
};

export default DocFoldersPage;
