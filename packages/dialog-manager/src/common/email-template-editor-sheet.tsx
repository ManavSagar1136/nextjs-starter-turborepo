"use client";

import React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@buildbase/ui/components/ui/sheet";
import { UnlayerEditor } from "@buildbase/components";
import { Button } from "@buildbase/ui/components/ui/button";
import { Textarea } from "@buildbase/ui/textarea";
import { Label } from "@buildbase/ui/components/ui/label";
import { EmailTemplateType } from "@buildbase/database";
import type { DialogOrSheetBaseProps } from "../base-props";

/**
 * Props for the EmailTemplateEditorSheet
 */
export interface EmailTemplateEditorSheetProps extends DialogOrSheetBaseProps {
  templateType: EmailTemplateType;
  initialDesign?: string;
  initialHtml?: string;
  initialText?: string;
  /**
   * Callback when content is saved
   */
  onSave: (data: {
    design?: string;
    html?: string;
    text?: string;
    templateType: EmailTemplateType;
  }) => void | Promise<void>;
  /**
   * Loading state
   */
  isLoading?: boolean;
}

/**
 * Helper function to get template type info
 */
function getTemplateTypeInfo(templateType: EmailTemplateType) {
  switch (templateType) {
    case EmailTemplateType.UNLAYER:
      return {
        label: "Unlayer Design",
        description: "Edit your email template using the visual drag-and-drop editor",
      };
    case EmailTemplateType.HTML:
      return {
        label: "HTML",
        description: "Edit your HTML email template content",
      };
    case EmailTemplateType.TEXT:
      return {
        label: "Plain Text",
        description: "Edit your plain text email template content",
      };
  }
}

/**
 * Sheet for editing email template content (Unlayer, HTML, or Text)
 * Used within the email template form in edit mode
 */
export function EmailTemplateEditorSheet({
  open,
  onOpenChange,
  templateType,
  initialDesign,
  initialHtml,
  initialText,
  onSave,
  isLoading = false,
}: EmailTemplateEditorSheetProps) {
  const [htmlValue, setHtmlValue] = React.useState(initialHtml || "");
  const [textValue, setTextValue] = React.useState(initialText || "");

  React.useEffect(() => {
    if (open) {
      setHtmlValue(initialHtml || "");
      setTextValue(initialText || "");
    }
  }, [open, initialHtml, initialText]);

  const { label, description } = getTemplateTypeInfo(templateType);

  const handleUnlayerSave = async (designJson: string, htmlContent: string) => {
    try {
      await onSave({
        design: designJson,
        html: htmlContent,
        templateType: EmailTemplateType.UNLAYER,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handling is done by the parent component
      console.error("Error saving Unlayer design:", error);
    }
  };

  const handleHtmlSave = async () => {
    try {
      await onSave({
        html: htmlValue,
        templateType: EmailTemplateType.HTML,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handling is done by the parent component
      console.error("Error saving HTML:", error);
    }
  };

  const handleTextSave = async () => {
    try {
      await onSave({
        text: textValue,
        templateType: EmailTemplateType.TEXT,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handling is done by the parent component
      console.error("Error saving text:", error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`w-full max-w-[98vw] sm:max-w-[98vw] lg:max-w-[95vw] ${
          templateType === EmailTemplateType.UNLAYER ? "flex h-screen flex-col overflow-hidden p-0" : "overflow-y-auto"
        }`}
      >
        {templateType === EmailTemplateType.UNLAYER ? (
          <div className="flex h-full flex-col">
            <SheetHeader className="flex-shrink-0 border-b px-6 py-4">
              <SheetTitle>{label} Editor</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-hidden px-6 pb-6">
              <UnlayerEditor
                initialDesign={initialDesign || undefined}
                initialHtml={initialHtml || undefined}
                onSave={handleUnlayerSave}
                isLoading={isLoading}
                minHeight="100%"
              />
            </div>
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>{label} Editor</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              {templateType === EmailTemplateType.HTML && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="html-sheet">HTML Content</Label>
                    <Textarea
                      id="html-sheet"
                      placeholder="<h1>Welcome, {{userName}}!</h1><p>Thank you for joining {{appName}}.</p>..."
                      className="min-h-[500px] font-mono text-sm"
                      value={htmlValue}
                      onChange={e => setHtmlValue(e.target.value)}
                    />
                    <div className="bg-muted/50 rounded-md p-3">
                      <p className="text-muted-foreground text-xs">
                        <strong>Variables:</strong> Use{" "}
                        <code className="bg-background rounded px-1 py-0.5">{"{{variableName}}"}</code> to insert
                        dynamic content
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 border-t pt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleHtmlSave} disabled={isLoading || !htmlValue.trim()}>
                      Save
                    </Button>
                  </div>
                </div>
              )}

              {templateType === EmailTemplateType.TEXT && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="text-sheet">Plain Text Content</Label>
                    <Textarea
                      id="text-sheet"
                      placeholder="Welcome, {{userName}}! Thank you for joining {{appName}}..."
                      className="min-h-[500px] font-mono text-sm"
                      value={textValue}
                      onChange={e => setTextValue(e.target.value)}
                    />
                    <div className="bg-muted/50 rounded-md p-3">
                      <p className="text-muted-foreground text-xs">
                        <strong>Variables:</strong> Use{" "}
                        <code className="bg-background rounded px-1 py-0.5">{"{{variableName}}"}</code> to insert
                        dynamic content. Plain text emails are simpler and have better compatibility across email
                        clients.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 border-t pt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleTextSave} disabled={isLoading || !textValue.trim()}>
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default EmailTemplateEditorSheet;
