"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@buildbase/ui/components/ui/button";
import { Mail, Plus, Edit, Trash2, TestTube } from "lucide-react";
import { useDialogManager, type CommonDialogProps, COMMON_DIALOG_KEYS } from "@buildbase/dialog-manager";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@buildbase/ui/components/ui/table";
import { Badge } from "@buildbase/ui/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@buildbase/ui/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { API } from "@/services";
import type { EmailProvider } from "@/services/email";

const EmailProvidersPage = () => {
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const { openDialog } = useDialogManager();

  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      const data = await API.email.providers.list();
      setProviders(data);
    } catch (error) {
      console.error("Failed to fetch providers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [refreshCounter]);

  const handleCreate = () => {
    const props: CommonDialogProps<typeof COMMON_DIALOG_KEYS.EMAIL_PROVIDER> = {
      mode: "create",
      onSaveProvider: async (data: any) => {
        return await API.email.providers.create(data);
      },
      onSuccess: () => {
        setRefreshCounter(prev => prev + 1);
      },
    };
    openDialog(COMMON_DIALOG_KEYS.EMAIL_PROVIDER, props);
  };

  const handleEdit = (provider: EmailProvider) => {
    const props: CommonDialogProps<typeof COMMON_DIALOG_KEYS.EMAIL_PROVIDER> = {
      mode: "edit",
      providerId: provider.id,
      initialData: {
        name: provider.name,
        description: provider.description,
        type: provider.type,
        fromName: provider.fromName,
        fromEmail: provider.fromEmail,
        isDefault: provider.isDefault,
        isActive: provider.isActive,
      },
      onFetchProvider: async (id: string) => {
        const data = await API.email.providers.getById(id, true);
        return {
          name: data.name,
          description: data.description,
          type: data.type,
          fromName: data.fromName,
          fromEmail: data.fromEmail,
          replyTo: data.replyTo,
          isDefault: data.isDefault,
          isActive: data.isActive,
          config: data.config as Record<string, unknown>,
        };
      },
      onSaveProvider: async (data: any, mode: "create" | "edit", id?: string) => {
        if (mode === "create") {
          return await API.email.providers.create(data);
        } else if (id) {
          return await API.email.providers.update(id, data);
        }
        throw new Error("Provider ID is required for edit mode");
      },
      onSuccess: () => {
        setRefreshCounter(prev => prev + 1);
      },
    };
    openDialog(COMMON_DIALOG_KEYS.EMAIL_PROVIDER, props);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this provider?")) return;

    try {
      await API.email.providers.remove(id);
      setRefreshCounter(prev => prev + 1);
    } catch (error) {
      console.error("Failed to delete provider:", error);
    }
  };

  const handleTest = async (id: string) => {
    try {
      const result = await API.email.providers.testConnection(id);
      if (result.success) {
        alert("Provider test successful!");
      } else {
        alert(`Provider test failed: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to test provider:", error);
      alert("Failed to test provider");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Mail className="h-5 w-5" />
              Email Providers
            </h1>
            <p className="text-muted-foreground mt-1">Manage email providers and configurations</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Button>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Loading providers...</div>
        ) : providers.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No providers found. Create your first provider to get started.
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Emails Sent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map(provider => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">
                      {provider.name}
                      {provider.isDefault && (
                        <Badge variant="secondary" className="ml-2">
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{provider.type}</Badge>
                    </TableCell>
                    <TableCell>{provider.fromEmail}</TableCell>
                    <TableCell>
                      <Badge variant={provider.isActive ? "default" : "secondary"}>
                        {provider.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{provider.emailsSent.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleTest(provider.id)}>
                            <TestTube className="mr-2 h-4 w-4" />
                            Test Connection
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(provider)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(provider.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

export default EmailProvidersPage;
