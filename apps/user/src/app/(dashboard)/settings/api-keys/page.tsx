"use client";

import React from "react";
import { KeyRound, Plus, Trash2, AlertCircle, ShieldOff, Crown } from "lucide-react";
import { useTanstackQuery } from "@buildbase/tanstack-query/hooks/use-tanstack-query";
import { useTanstackMutation } from "@buildbase/tanstack-query/hooks/use-tanstack-mutation";
import { COMMON_DIALOG_KEYS, CONFIRMATION_DIALOG_VARIANTS } from "@buildbase/dialog-manager";
import { useUserDialogManager } from "@/dialogs/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@buildbase/ui/components/ui/card";
import { Button } from "@buildbase/ui/components/ui/button";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { API_KEY_DIALOG_KEYS } from "@/dialogs/setup";
import type { CreatedApiKey } from "@/dialogs/api-keys/CreateApiKeyDialog";
import { useSDKAuth } from "@/hooks/useSDKAuth";
import { FeatureButton } from "@/components/feature-gate/FeatureButton";
import { FeatureGate } from "@/components/feature-gate/FeatureGate";
import { PLAN_FEATURES, WhenWorkspaceRoles } from "@buildbase/saas-sdk";
import { WORKSPACE_ROLES } from "@buildbase/database/user";

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
  const res = await fetch(`/api/v1/api-keys?${new URLSearchParams({ id })}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to revoke API key");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ApiKeysPage() {
  const { openDialog } = useUserDialogManager();
  const { isAdmin, activeWorkspaceId, openSubscriptionSettings } = useSDKAuth();

  const {
    data: keys = [],
    isLoading,
    isError,
    refetch,
  } = useTanstackQuery<ApiKey[]>({
    queryKey: ["api-keys", activeWorkspaceId],
    queryFn: fetchApiKeys,
    enabled: !!activeWorkspaceId,
  });

  const revokeMutation = useTanstackMutation<void, Error, string>({
    mutationFn: (id: string) => revokeApiKey(id),
    invalidateQueries: [["api-keys", activeWorkspaceId]],
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
    <div className="container mx-auto py-8">
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

        {/*
         * FeatureButton gates on two things simultaneously:
         *   1. Plan feature flag — requires "api-access" to be enabled on the subscription
         *   2. Role permission   — requires isAdmin (hasPermission prop)
         * If either check fails, a contextual popover explains why and optionally opens
         * the FeatureAccessDeniedDialog (for plan denials) or shows a lock (for role denials).
         */}
        <FeatureButton
          featureSlug={PLAN_FEATURES.API_ACCESS}
          featureName="API Key Management"
          hasPermission={isAdmin}
          onExecute={handleCreate}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Key
        </FeatureButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your API Keys</CardTitle>
          <CardDescription>
            Keys are masked — only the prefix is shown. Revoke any key you no longer need.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeatureGate
            featureSlug={PLAN_FEATURES.API_ACCESS}
            fallback={
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="bg-primary/10 rounded-full p-4">
                  <Crown className="text-primary h-8 w-8" />
                </div>
                <div>
                  <p className="font-semibold">API Access not included</p>
                  <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
                    Your current plan doesn&apos;t include API key management. Upgrade your plan to create and manage
                    API keys.
                  </p>
                </div>
                <Button onClick={openSubscriptionSettings}>Upgrade Plan</Button>
              </div>
            }
            loadingFallback={<p className="text-muted-foreground py-8 text-center text-sm">Loading…</p>}
          >
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
                {isAdmin
                  ? "No API keys yet. Create one to get started."
                  : "No API keys have been created for this workspace yet."}
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

                    {/* Revoke button visible only to admins */}
                    <WhenWorkspaceRoles roles={[WORKSPACE_ROLES.ADMIN]}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive ml-4 shrink-0"
                        onClick={() => handleRevoke(key)}
                        title="Revoke API key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </WhenWorkspaceRoles>
                  </div>
                ))}
              </div>
            )}

            {/* Informational notice for non-admins */}
            <WhenWorkspaceRoles roles={[WORKSPACE_ROLES.EDITOR, WORKSPACE_ROLES.VIEWER]} fallback={null}>
              <div className="text-muted-foreground mt-4 flex items-center gap-1.5 border-t pt-4 text-xs">
                <ShieldOff className="h-3.5 w-3.5 shrink-0" />
                <span>Only workspace admins can create or revoke API keys.</span>
              </div>
            </WhenWorkspaceRoles>
          </FeatureGate>
        </CardContent>
      </Card>
    </div>
  );
}
