"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";
import { EmailTemplateForm } from "@buildbase/components";
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
 * Dialog for creating and editing email templates
 * Uses Dialog with max-width for comfortable HTML editing
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

  const handleSubmit = async (data: any) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Email Template" : "Edit Email Template"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new email template with variables support"
              : "Update the email template details"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <EmailTemplateForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isLoading={isLoading}
            mode={mode}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EmailTemplateDialog;
