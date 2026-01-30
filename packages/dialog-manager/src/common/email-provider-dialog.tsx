"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";
import { EmailProviderForm } from "@buildbase/components";
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

  const handleSubmit = async (data: any) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Email Provider" : "Edit Email Provider"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Configure a new email provider" : "Update the provider configuration"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <EmailProviderForm
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

export default EmailProviderDialog;
