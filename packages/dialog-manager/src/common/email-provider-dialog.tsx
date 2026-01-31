"use client";

import React, { useState, useEffect, useRef } from "react";
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
    config?: Record<string, unknown>;
  };
  onSuccess?: (provider: unknown) => void;
  /**
   * Callback to fetch provider data with decrypted config (required for edit mode)
   */
  onFetchProvider?: (id: string) => Promise<{
    name: string;
    description?: string;
    type: string;
    fromName: string;
    fromEmail: string;
    replyTo?: string;
    isDefault: boolean;
    isActive: boolean;
    config: Record<string, unknown>;
  }>;
  /**
   * Callback to save provider data
   */
  onSaveProvider: (data: any, mode: "create" | "edit", id?: string) => Promise<any>;
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
  onFetchProvider,
  onSaveProvider,
}: EmailProviderDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const hasFetchedRef = useRef(false);
  const lastProviderIdRef = useRef<string | undefined>(undefined);

  // Reset fetch flag when dialog closes or providerId changes
  useEffect(() => {
    if (!open) {
      hasFetchedRef.current = false;
      lastProviderIdRef.current = undefined;
      setFormData(initialData);
    } else if (lastProviderIdRef.current !== providerId) {
      hasFetchedRef.current = false;
      lastProviderIdRef.current = providerId;
    }
  }, [open, providerId, initialData]);

  // Fetch provider data with decrypted config when in edit mode
  useEffect(() => {
    if (open && mode === "edit" && providerId && !hasFetchedRef.current && onFetchProvider) {
      hasFetchedRef.current = true;
      setIsLoadingData(true);
      onFetchProvider(providerId)
        .then(data => {
          setFormData(data);
        })
        .catch(error => {
          console.error("Failed to fetch provider:", error);
          hasFetchedRef.current = false; // Allow retry on error
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    } else if (open && mode === "create") {
      // Reset form data for create mode
      setFormData(initialData);
    }
  }, [open, mode, providerId, onFetchProvider, initialData]);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const result = await onSaveProvider(data, mode, providerId);
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
          {isLoadingData ? (
            <div className="text-muted-foreground py-8 text-center">Loading provider details...</div>
          ) : (
            <EmailProviderForm
              initialData={formData}
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              isLoading={isLoading}
              mode={mode}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EmailProviderDialog;
