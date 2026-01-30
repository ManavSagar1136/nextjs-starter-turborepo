"use client";

import React, { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@buildbase/ui/components/ui/sheet";
import type { DialogOrSheetBaseProps } from "../base-props";

/**
 * Props for the EmailProviderDialog
 */
export interface EmailProviderDialogProps extends DialogOrSheetBaseProps {
  mode: "create" | "edit";
  providerId?: string;
  initialData?: {
    name?: string;
    description?: string;
    type?: string;
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
    isDefault?: boolean;
    isActive?: boolean;
  };
  onSuccess?: (provider: unknown) => void;
}

/**
 * Dialog/Sheet for creating and editing email providers
 */
export function EmailProviderDialog({
  open,
  onOpenChange,
  mode,
  providerId,
  initialData,
  onSuccess,
}: EmailProviderDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const url = mode === "create" ? "/api/email/providers" : `/api/email/providers/${providerId}`;

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save provider");
      }

      const result = await response.json();
      onSuccess?.(result);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save provider:", error);
      // Toast notification would go here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Add Email Provider" : "Edit Email Provider"}</SheetTitle>
          <SheetDescription>
            {mode === "create" ? "Configure a new email provider" : "Update the provider configuration"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <EmailProviderFormPlaceholder
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isLoading={isLoading}
            mode={mode}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Placeholder form - apps should replace this with actual form
 */
function EmailProviderFormPlaceholder({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  mode,
}: {
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  mode: "create" | "edit";
}) {
  const [formData, setFormData] = useState({
    name: "",
    type: "CONSOLE",
    fromName: "",
    fromEmail: "",
    config: {},
    ...initialData,
  });

  return (
    <form
      onSubmit={async e => {
        e.preventDefault();
        await onSubmit(formData);
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <label className="text-sm font-medium">Provider Name</label>
        <input
          type="text"
          value={formData.name as string}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-md border px-3 py-2"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Type</label>
        <select
          value={formData.type as string}
          onChange={e => setFormData({ ...formData, type: e.target.value })}
          className="w-full rounded-md border px-3 py-2"
          disabled={mode === "edit"}
        >
          <option value="CONSOLE">Console (Dev)</option>
          <option value="SMTP">SMTP</option>
          <option value="RESEND">Resend</option>
          <option value="MAILGUN">Mailgun</option>
          <option value="SENDGRID">SendGrid</option>
          <option value="SES">AWS SES</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">From Name</label>
          <input
            type="text"
            value={formData.fromName as string}
            onChange={e => setFormData({ ...formData, fromName: e.target.value })}
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">From Email</label>
          <input
            type="email"
            value={formData.fromEmail as string}
            onChange={e => setFormData({ ...formData, fromEmail: e.target.value })}
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="rounded-md border px-4 py-2">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground rounded-md px-4 py-2">
          {isLoading ? "Saving..." : mode === "create" ? "Create" : "Save"}
        </button>
      </div>
    </form>
  );
}

export default EmailProviderDialog;
