"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";
import { EmailTemplateForm } from "@buildbase/components";
import { EmailTemplateType } from "@buildbase/database";
import { useDialogManager, COMMON_DIALOG_KEYS } from "../index";
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
    templateType?: EmailTemplateType;
    html?: string;
    text?: string;
    design?: string;
    category?: string;
    isActive?: boolean;
  };
  onSuccess?: (template: unknown) => void;
  /**
   * Callback to fetch template data (for edit mode)
   */
  onFetchTemplate?: (id: string) => Promise<{
    slug?: string;
    name: string;
    description?: string;
    subject: string;
    templateType?: EmailTemplateType;
    html?: string;
    text?: string;
    design?: string;
    category: string;
    isActive?: boolean;
  }>;
  /**
   * Callback to save template data
   */
  onSaveTemplate: (data: any, mode: "create" | "edit", id?: string) => Promise<any>;
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
  onFetchTemplate,
  onSaveTemplate,
}: EmailTemplateDialogProps) {
  const { openDialog } = useDialogManager();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fetch template data when in edit mode
  useEffect(() => {
    if (
      open &&
      mode === "edit" &&
      templateId &&
      onFetchTemplate &&
      !formData?.html &&
      !formData?.text &&
      !formData?.design
    ) {
      setIsLoadingData(true);
      onFetchTemplate(templateId)
        .then(data => {
          // Determine template type from fetched data
          const templateType = data.design
            ? EmailTemplateType.UNLAYER
            : data.html
              ? EmailTemplateType.HTML
              : data.text
                ? EmailTemplateType.TEXT
                : EmailTemplateType.HTML;
          setFormData({ ...data, templateType });
        })
        .catch(error => {
          console.error("Failed to fetch template:", error);
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    } else if (open && mode === "create") {
      // Reset form data for create mode
      setFormData(initialData);
    }
  }, [open, mode, templateId, initialData, formData?.html, formData?.text, formData?.design, onFetchTemplate]);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const result = await onSaveTemplate(data, mode, templateId);
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
      <DialogContent className="w-full min-w-full max-w-5xl overflow-y-auto">
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <DialogTitle>{mode === "create" ? "Create Email Template" : "Edit Email Template"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new email template with variables support"
              : "Update the email template details"}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-4">
          {isLoadingData ? (
            <div className="text-muted-foreground py-8 text-center">Loading template details...</div>
          ) : (
            <EmailTemplateForm
              initialData={formData}
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              isLoading={isLoading}
              mode={mode}
              onOpenEditor={(options: {
                templateType: EmailTemplateType;
                initialDesign?: string;
                initialHtml?: string;
                initialText?: string;
                onSave: (data: {
                  design?: string;
                  html?: string;
                  text?: string;
                  templateType: EmailTemplateType;
                }) => void;
                isLoading?: boolean;
              }) => {
                openDialog(COMMON_DIALOG_KEYS.EMAIL_TEMPLATE_EDITOR_SHEET, {
                  ...options,
                });
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EmailTemplateDialog;
