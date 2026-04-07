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
import type { DialogOrSheetBaseProps } from "@buildbase/dialog-manager";

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

export const CreateApiKeyDialog: React.FC<CreateApiKeyDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const [name, setName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (isPending) return;
    setName("");
    setError(null);
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || isPending) return;
    setIsPending(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError((json as { error?: string }).error ?? "Failed to create API key");
        return;
      }

      setName("");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>Give the key a descriptive name so you can identify it later.</DialogDescription>
        </DialogHeader>

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
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!name.trim() || isPending}>
            {isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
