"use client";

import React from "react";
import { KeyRound, Plus, Trash2, AlertCircle } from "lucide-react";
import { useTanstackQuery } from "@buildbase/tanstack-query/hooks/use-tanstack-query";
import { useTanstackMutation } from "@buildbase/tanstack-query/hooks/use-tanstack-mutation";
import { useDialogManager } from "@buildbase/dialog-manager";
import { COMMON_DIALOG_KEYS, CONFIRMATION_DIALOG_VARIANTS } from "@buildbase/dialog-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@buildbase/ui/components/ui/card";
import { Button } from "@buildbase/ui/components/ui/button";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { API_KEY_DIALOG_KEYS } from "@/dialogs/setup";
import type { CreatedApiKey } from "@/dialogs/api-keys/CreateApiKeyDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  rateLimitPerMinute: number;
  lastUsedAt: string | null;
  usageCount: number;
  createdAt: string;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchApiKeys(): Promise<ApiKey[]> {
  const res = await fetch("/api/v1/api-keys");
  if (!res.ok) throw new Error("Failed to fetch API keys");
  const json = await res.json();
  return (json as { data: ApiKey[] }).data;
}

async function revokeApiKey(id: string): Promise<void> {
  const res = await fetch(`/api/v1/api-keys?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to revoke API key");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ApiKeysPage() {
  const { openDialog } = useDialogManager();

  const {
    data: keys = [],
    isLoading,
    isError,
    refetch,
  } = useTanstackQuery<ApiKey[]>({
    queryKey: ["api-keys"],
    queryFn: fetchApiKeys,
  });

  const revokeMutation = useTanstackMutation<void, Error, string>({
    mutationFn: (id: string) => revokeApiKey(id),
    invalidateQueries: [["api-keys"]],
    toast: true,
    toastProps: {
      success: { title: "API key revoked" },
      error: { title: "Failed to revoke API key" },
    },
  });

  const handleCreate = () => {
    openDialog(API_KEY_DIALOG_KEYS.CREATE, {
      onSuccess: (createdKey: CreatedApiKey) => {
        void refetch();
        openDialog(API_KEY_DIALOG_KEYS.REVEAL, { rawKey: createdKey.rawKey });
      },
    });
  };

  const handleRevoke = (key: ApiKey) => {
    openDialog(COMMON_DIALOG_KEYS.CONFIRMATION, {
      variant: CONFIRMATION_DIALOG_VARIANTS.DELETE,
      entity: "API key",
      itemName: key.name,
      confirmButtonProps: {
        onAction: async () => {
          await revokeMutation.mutateAsync(key.id);
          return { success: true };
        },
      },
    });
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <KeyRound className="h-6 w-6" />
            API Keys
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Authenticate your application with the REST API using these keys.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your API Keys</CardTitle>
          <CardDescription>
            Keys are masked — only the prefix is shown. Revoke any key you no longer need.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center text-sm">Loading…</p>
          ) : isError ? (
            <div className="text-destructive flex flex-col items-center gap-2 py-8 text-center text-sm">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load API keys.</p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : keys.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No API keys yet. Create one to get started.
            </p>
          ) : (
            <div className="divide-y">
              {keys.map(key => (
                <div key={key.id} className="flex items-center justify-between py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{key.name}</p>
                    <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="font-mono">{key.prefix}••••••••</span>
                      <span>Created {formatDate(key.createdAt)}</span>
                      {key.lastUsedAt ? <span>Last used {formatDate(key.lastUsedAt)}</span> : <span>Never used</span>}
                      <span>{key.usageCount} requests</span>
                    </div>
                    {key.scopes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {key.scopes.map(s => (
                          <Badge key={s} variant="secondary" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive ml-4 shrink-0"
                    onClick={() => handleRevoke(key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
