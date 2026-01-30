"use client";

import React, { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@buildbase/ui/components/ui/sheet";
import type { DialogOrSheetBaseProps } from "../base-props";

/**
 * Props for the EmailTemplateDialog
 */
export interface EmailTemplateDialogProps extends DialogOrSheetBaseProps {
  mode: "create" | "edit";
  templateId?: string;
  initialData?: {
    slug?: string;
    name?: string;
    description?: string;
    subject?: string;
    html?: string;
    text?: string;
    category?: string;
    isActive?: boolean;
  };
  onSuccess?: (template: unknown) => void;
}

/**
 * Dialog/Sheet for creating and editing email templates
 * Uses Sheet for more space for HTML editing
 */
export function EmailTemplateDialog({
  open,
  onOpenChange,
  mode,
  templateId,
  initialData,
  onSuccess,
}: EmailTemplateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const url = mode === "create" ? "/api/email/templates" : `/api/email/templates/${templateId}`;

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save template");
      }

      const result = await response.json();
      onSuccess?.(result);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save template:", error);
      // Toast notification would go here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Create Email Template" : "Edit Email Template"}</SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Create a new email template with variables support"
              : "Update the email template details"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {/* 
            EmailTemplateForm will be rendered here by the app
            that registers this dialog, passing the form component
          */}
          <EmailTemplateFormPlaceholder
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
function EmailTemplateFormPlaceholder({
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
    subject: "",
    html: "",
    category: "TRANSACTIONAL",
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
        <label className="text-sm font-medium">Name</label>
        <input
          type="text"
          value={formData.name as string}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-md border px-3 py-2"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Subject</label>
        <input
          type="text"
          value={formData.subject as string}
          onChange={e => setFormData({ ...formData, subject: e.target.value })}
          className="w-full rounded-md border px-3 py-2"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">HTML Content</label>
        <textarea
          value={formData.html as string}
          onChange={e => setFormData({ ...formData, html: e.target.value })}
          className="min-h-[200px] w-full rounded-md border px-3 py-2 font-mono text-sm"
          required
        />
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

export default EmailTemplateDialog;
