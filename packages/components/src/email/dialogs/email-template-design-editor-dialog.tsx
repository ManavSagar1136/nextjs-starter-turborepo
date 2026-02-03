"use client";

import React, { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@buildbase/ui/components/ui/sheet";
import { UnlayerEditor } from "../unlayer-editor";
import type { DialogOrSheetBaseProps } from "@buildbase/dialog-manager";

/**
 * Props for the EmailTemplateDesignEditorDialog
 */
export interface EmailTemplateDesignEditorDialogProps extends DialogOrSheetBaseProps {
  templateId: string;
  templateName?: string;
  initialDesign?: string;
  initialHtml?: string;
  /**
   * Callback to save the design
   */
  onSaveDesign: (templateId: string, design: string, html: string) => Promise<void>;
  /**
   * Callback when save is successful
   */
  onSuccess?: () => void;
}

/**
 * Sheet/Dialog for editing email template design directly using Unlayer editor
 * Opens as a full-screen sheet for better editing experience
 */
export function EmailTemplateDesignEditorDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  initialDesign,
  initialHtml,
  onSaveDesign,
  onSuccess,
}: EmailTemplateDesignEditorDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (design: string, html: string) => {
    setIsLoading(true);
    try {
      await onSaveDesign(templateId, design, html);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save design:", error);
      // Error handling would be done by the parent component
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-[98vw] overflow-hidden p-0 sm:max-w-[98vw] lg:max-w-[95vw]">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>Edit Design - {templateName || "Email Template"}</SheetTitle>
            <SheetDescription>Edit the email template design using the visual editor</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-hidden px-6 py-4">
            <UnlayerEditor
              initialDesign={initialDesign}
              initialHtml={initialHtml}
              onSave={handleSave}
              isLoading={isLoading}
              minHeight="calc(100vh - 200px)"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default EmailTemplateDesignEditorDialog;
