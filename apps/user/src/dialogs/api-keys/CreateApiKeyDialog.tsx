"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@buildbase/ui/components/ui/dialog";
import { Button } from "@buildbase/ui/components/ui/button";
import { Input } from "@buildbase/ui/components/ui/input";
import { Label } from "@buildbase/ui/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@buildbase/ui/components/ui/select";
import type { DialogOrSheetBaseProps } from "@buildbase/dialog-manager";

// ─── Scope definitions ────────────────────────────────────────────────────────

type Permission = "none" | "read" | "write";

interface ScopeResource {
  key: string;
  label: string;
  description: string;
}

const SCOPE_RESOURCES: ScopeResource[] = [
  { key: "templates", label: "Templates", description: "Email templates and layouts" },
  { key: "assets", label: "Assets", description: "Media library and file uploads" },
  { key: "members", label: "Members", description: "Workspace member management" },
  { key: "settings", label: "Settings", description: "Workspace settings and configuration" },
];

function buildScopes(permissions: Record<string, Permission>): string[] {
  const scopes: string[] = [];
  for (const [key, perm] of Object.entries(permissions)) {
    if (perm === "read") scopes.push(`${key}:read`);
    else if (perm === "write") scopes.push(`${key}:read`, `${key}:write`);
  }
  return scopes;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreatedApiKey {
  id: string;
  name: string;
  prefix: string;
  rawKey: string;
  scopes: string[];
  createdAt: string;
}

export interface CreateApiKeyDialogProps extends DialogOrSheetBaseProps {
  onSuccess?: (key: CreatedApiKey) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const initialPermissions = (): Record<string, Permission> =>
  Object.fromEntries(SCOPE_RESOURCES.map(r => [r.key, "none"]));

export const CreateApiKeyDialog: React.FC<CreateApiKeyDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<Record<string, Permission>>(initialPermissions);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (isPending) return;
    setName("");
    setPermissions(initialPermissions());
    setError(null);
    onOpenChange(false);
  };

  const setPermission = (key: string, value: Permission) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!name.trim() || isPending) return;
    setIsPending(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), scopes: buildScopes(permissions) }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError((json as { error?: string }).error ?? "Failed to create API key");
        return;
      }

      setName("");
      setPermissions(initialPermissions());
      onOpenChange(false);
      onSuccess?.((json as { data: CreatedApiKey }).data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>Give the key a name and configure permissions for each resource.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="api-key-name">Name</Label>
            <Input
              id="api-key-name"
              placeholder="e.g. Production, Staging"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") void handleSubmit();
              }}
              disabled={isPending}
              maxLength={100}
            />
            <p className="text-muted-foreground text-right text-xs">{name.length}/100</p>
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="rounded-md border">
              <div className="text-muted-foreground grid grid-cols-[1fr_auto] border-b px-3 py-2 text-xs font-medium uppercase tracking-wide">
                <span>Resource</span>
                <span className="w-28 text-right">Access</span>
              </div>
              {SCOPE_RESOURCES.map((resource, idx) => (
                <div
                  key={resource.key}
                  className={`grid grid-cols-[1fr_auto] items-center px-3 py-2.5 ${
                    idx < SCOPE_RESOURCES.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{resource.label}</p>
                    <p className="text-muted-foreground text-xs">{resource.description}</p>
                  </div>
                  <Select
                    value={permissions[resource.key]}
                    onValueChange={val => setPermission(resource.key, val as Permission)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="write">Write</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              Write access includes read. None grants no access to that resource.
            </p>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!name.trim() || isPending}>
            {isPending ? "Creating…" : "Create Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
