"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@buildbase/ui/input";
import { Button } from "@buildbase/ui/button";
import { Label } from "@buildbase/ui/components/ui/label";
import { FileCode, Type, Palette } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@buildbase/ui/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@buildbase/ui/components/ui/radio-group";
import { Checkbox } from "@buildbase/ui/components/ui/checkbox";
// Dialog manager functions passed as props to avoid circular dependency

/**
 * Email template categories
 */
const TEMPLATE_CATEGORIES = [
  { value: "TRANSACTIONAL", label: "Transactional" },
  { value: "MARKETING", label: "Marketing" },
  { value: "NEWSLETTER", label: "Newsletter" },
  { value: "NOTIFICATION", label: "Notification" },
  { value: "WELCOME", label: "Welcome" },
  { value: "VERIFICATION", label: "Verification" },
  { value: "PASSWORD_RESET", label: "Password Reset" },
  { value: "INVITATION", label: "Invitation" },
  { value: "REMINDER", label: "Reminder" },
  { value: "CUSTOM", label: "Custom" },
] as const;

import { EmailTemplateType } from "@buildbase/database";

export interface EmailTemplateFormData {
  slug?: string;
  name: string;
  description?: string;
  subject: string;
  templateType: EmailTemplateType; // Type of template: unlayer, html, or text
  html?: string; // Required only if templateType is "html"
  text?: string; // Required only if templateType is "text"
  design?: string; // Unlayer design JSON - required only if templateType is "unlayer"
  category: string;
  isActive?: boolean;
}

export interface EmailTemplateFormProps {
  initialData?: Partial<EmailTemplateFormData & { design?: string }>;
  onSubmit: (data: EmailTemplateFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: "create" | "edit";
  /**
   * Function to open the editor sheet/dialog
   * Passed from parent to avoid circular dependency with @buildbase/dialog-manager
   */
  onOpenEditor?: (options: {
    templateType: EmailTemplateType;
    initialDesign?: string;
    initialHtml?: string;
    initialText?: string;
    onSave: (data: { design?: string; html?: string; text?: string; templateType: EmailTemplateType }) => void;
    isLoading?: boolean;
  }) => void;
}

/**
 * Form for creating/editing email templates
 */
export function EmailTemplateForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = "create",
  onOpenEditor,
}: EmailTemplateFormProps) {
  // Determine initial template type from initialData
  const getInitialTemplateType = (): EmailTemplateType => {
    if (initialData?.design) return EmailTemplateType.UNLAYER;
    if (initialData?.html) return EmailTemplateType.HTML;
    if (initialData?.text) return EmailTemplateType.TEXT;
    return EmailTemplateType.HTML; // Default to HTML
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<EmailTemplateFormData>({
    defaultValues: {
      name: "",
      description: "",
      subject: "",
      templateType: getInitialTemplateType(),
      html: "",
      text: "",
      design: "",
      category: "TRANSACTIONAL",
      isActive: true,
      ...initialData,
    },
  });

  const category = watch("category");
  const isActive = watch("isActive");
  const templateType = watch("templateType");
  const html = watch("html");
  const text = watch("text");
  const design = watch("design");

  // Open editor sheet using provided callback
  const handleOpenEditor = () => {
    if (templateType && onOpenEditor) {
      onOpenEditor({
        templateType,
        initialDesign: design || undefined,
        initialHtml: html || undefined,
        initialText: text || undefined,
        onSave: (data: { design?: string; html?: string; text?: string; templateType: EmailTemplateType }) => {
          // Always update template type when saving from editor
          if (data.templateType) {
            setValue("templateType", data.templateType, { shouldValidate: true });
            // Clear other template type fields when switching
            if (data.templateType !== EmailTemplateType.HTML) {
              setValue("html", "", { shouldValidate: false });
            }
            if (data.templateType !== EmailTemplateType.TEXT) {
              setValue("text", "", { shouldValidate: false });
            }
            if (data.templateType !== EmailTemplateType.UNLAYER) {
              setValue("design", "", { shouldValidate: false });
            }
          }
          // Update the content for the saved template type
          if (data.design) {
            setValue("design", data.design, { shouldValidate: true });
          }
          if (data.html) {
            setValue("html", data.html, { shouldValidate: true });
          }
          if (data.text) {
            setValue("text", data.text, { shouldValidate: true });
          }
        },
        isLoading,
      });
    }
  };

  // Get template type label and icon
  const getTemplateTypeInfo = (type: EmailTemplateType) => {
    switch (type) {
      case EmailTemplateType.UNLAYER:
        return { label: "Unlayer Design", icon: Palette, description: "Visual drag-and-drop email editor" };
      case EmailTemplateType.HTML:
        return { label: "HTML", icon: FileCode, description: "Write HTML code directly" };
      case EmailTemplateType.TEXT:
        return { label: "Plain Text", icon: Type, description: "Plain text email content" };
      default:
        return { label: "HTML", icon: FileCode, description: "Write HTML code directly" };
    }
  };

  const handleFormSubmit = async (data: EmailTemplateFormData) => {
    // In create mode, only validate template type selection, not content
    // Content can be added later in edit mode
    if (mode === "create") {
      if (!data.templateType) {
        setError("templateType", {
          type: "manual",
          message: "Please select a template type",
        });
        return;
      }
    } else {
      // In edit mode, validate that the selected template type has content
      if (data.templateType === EmailTemplateType.UNLAYER && !data.design?.trim()) {
        setError("design", {
          type: "manual",
          message: "Please save your design using the 'Save Design' button in the Unlayer editor",
        });
        return;
      }
      if (data.templateType === EmailTemplateType.HTML && !data.html?.trim()) {
        setError("html", {
          type: "manual",
          message: "HTML content is required when using HTML template type",
        });
        return;
      }
      if (data.templateType === EmailTemplateType.TEXT && !data.text?.trim()) {
        setError("text", {
          type: "manual",
          message: "Plain text content is required when using Plain Text template type",
        });
        return;
      }
    }

    // Clean up data - only keep the relevant field based on template type
    const cleanedData: EmailTemplateFormData = {
      ...data,
      // Clear other template type fields
      html: data.templateType === EmailTemplateType.HTML ? data.html : undefined,
      text: data.templateType === EmailTemplateType.TEXT ? data.text : undefined,
      design: data.templateType === EmailTemplateType.UNLAYER ? data.design : undefined,
    };

    await onSubmit(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 pb-4">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <div>
          <h3 className="mb-3 text-sm font-semibold">Basic Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Template Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Welcome Email"
                {...register("name", { required: "Name is required" })}
                className="w-full"
              />
              {errors.name && <p className="text-destructive mt-1 text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="welcome-email (auto-generated if empty)"
                {...register("slug")}
                disabled={mode === "edit"}
                className="w-full"
              />
              {mode === "edit" && (
                <p className="text-muted-foreground mt-1 text-xs">Slug cannot be changed after creation</p>
              )}
              {mode === "create" && (
                <p className="text-muted-foreground mt-1 text-xs">Leave empty to auto-generate from name</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="e.g., Email sent to new users after signup"
            {...register("description")}
            className="w-full"
          />
          <p className="text-muted-foreground text-xs">Optional: Add a description for this template</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value: string) => setValue("category", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">Organize templates by purpose</p>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <div className="bg-muted/50 flex w-full items-center space-x-2 rounded-md border p-3">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={checked => setValue("isActive", checked === true)}
              />
              <div className="flex-1">
                <Label htmlFor="isActive" className="cursor-pointer font-medium">
                  Active
                </Label>
                <p className="text-muted-foreground text-xs">Enable this template for use</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Section */}
      <div className="space-y-4">
        <div>
          <h3 className="mb-1 text-sm font-semibold">Email Subject</h3>
          <p className="text-muted-foreground text-xs">The subject line that appears in the recipient's inbox</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">
            Subject Line <span className="text-destructive">*</span>
          </Label>
          <Input
            id="subject"
            placeholder="e.g., Welcome to {{appName}}, {{userName}}!"
            {...register("subject", { required: "Subject is required" })}
            className="w-full"
          />
          {errors.subject && <p className="text-destructive mt-1 text-xs">{errors.subject.message}</p>}
          <div className="bg-muted/50 rounded-md p-3">
            <p className="text-muted-foreground text-xs">
              <strong>Tip:</strong> Use <code className="bg-background rounded px-1 py-0.5">{"{{variableName}}"}</code>{" "}
              for dynamic content
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-4">
        <div>
          <h3 className="mb-1 text-sm font-semibold">Email Content</h3>
          <p className="text-muted-foreground text-xs">
            {mode === "create"
              ? "Select a template type. You can add the actual content after creating the template."
              : "Choose one template type: Unlayer Design (visual editor), HTML, or Plain Text"}
          </p>
        </div>

        {/* Template Type Selector - Radio Toggle */}
        <div className="space-y-2">
          <Label htmlFor="templateType">
            Template Type <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={templateType}
            onValueChange={(value: string) => {
              const newType = value as EmailTemplateType;
              setValue("templateType", newType, { shouldValidate: true });
              // Clear content when switching types in edit mode
              // This allows users to change template types and create new content
              if (newType !== EmailTemplateType.HTML) setValue("html", "", { shouldValidate: false });
              if (newType !== EmailTemplateType.TEXT) setValue("text", "", { shouldValidate: false });
              if (newType !== EmailTemplateType.UNLAYER) setValue("design", "", { shouldValidate: false });
            }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {/* Unlayer Design Option */}
            <label
              htmlFor="template-type-unlayer"
              className={`hover:bg-accent relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
                templateType === EmailTemplateType.UNLAYER
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background"
              }`}
            >
              <RadioGroupItem value={EmailTemplateType.UNLAYER} id="template-type-unlayer" className="sr-only" />
              <Palette
                className={`h-6 w-6 ${templateType === EmailTemplateType.UNLAYER ? "text-primary" : "text-muted-foreground"}`}
              />
              <div className="text-center">
                <p
                  className={`text-sm font-medium ${templateType === EmailTemplateType.UNLAYER ? "text-primary" : "text-foreground"}`}
                >
                  Unlayer Design
                </p>
                <p className="text-muted-foreground text-xs">Visual editor</p>
              </div>
            </label>

            {/* HTML Option */}
            <label
              htmlFor="template-type-html"
              className={`hover:bg-accent relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
                templateType === EmailTemplateType.HTML ? "border-primary bg-primary/5" : "border-border bg-background"
              }`}
            >
              <RadioGroupItem value={EmailTemplateType.HTML} id="template-type-html" className="sr-only" />
              <FileCode
                className={`h-6 w-6 ${templateType === EmailTemplateType.HTML ? "text-primary" : "text-muted-foreground"}`}
              />
              <div className="text-center">
                <p
                  className={`text-sm font-medium ${templateType === EmailTemplateType.HTML ? "text-primary" : "text-foreground"}`}
                >
                  HTML
                </p>
                <p className="text-muted-foreground text-xs">Code editor</p>
              </div>
            </label>

            {/* Plain Text Option */}
            <label
              htmlFor="template-type-text"
              className={`hover:bg-accent relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
                templateType === EmailTemplateType.TEXT ? "border-primary bg-primary/5" : "border-border bg-background"
              }`}
            >
              <RadioGroupItem value={EmailTemplateType.TEXT} id="template-type-text" className="sr-only" />
              <Type
                className={`h-6 w-6 ${templateType === EmailTemplateType.TEXT ? "text-primary" : "text-muted-foreground"}`}
              />
              <div className="text-center">
                <p
                  className={`text-sm font-medium ${templateType === EmailTemplateType.TEXT ? "text-primary" : "text-foreground"}`}
                >
                  Plain Text
                </p>
                <p className="text-muted-foreground text-xs">Text editor</p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {/* Editor Button and Preview - Only shown in edit mode */}
        {templateType && mode === "edit" && onOpenEditor && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => {
                  const { icon: Icon, label } = getTemplateTypeInfo(templateType);
                  return (
                    <>
                      <Icon className="text-muted-foreground h-4 w-4" />
                      <Label className="text-sm font-medium">{label} Editor</Label>
                    </>
                  );
                })()}
              </div>
              <Button type="button" variant="outline" onClick={handleOpenEditor} className="gap-2">
                {(() => {
                  const { icon: Icon } = getTemplateTypeInfo(templateType);
                  return <Icon className="h-4 w-4" />;
                })()}
                {templateType === EmailTemplateType.UNLAYER && design
                  ? "Edit Design"
                  : templateType === EmailTemplateType.HTML && html
                    ? "Edit HTML"
                    : templateType === EmailTemplateType.TEXT && text
                      ? "Edit Text"
                      : "Open Editor"}
              </Button>
            </div>

            {/* Content Preview/Status */}
            <div className="bg-muted/50 rounded-md border p-3">
              {templateType === EmailTemplateType.UNLAYER && (
                <div className="space-y-1">
                  {design ? (
                    <p className="text-muted-foreground text-xs">✓ Design saved. Click "Edit Design" to modify.</p>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      No design saved yet. Click "Open Editor" to create your email template.
                    </p>
                  )}
                  {errors.design && <p className="text-destructive text-xs">{errors.design.message}</p>}
                </div>
              )}
              {templateType === EmailTemplateType.HTML && (
                <div className="space-y-1">
                  {html ? (
                    <p className="text-muted-foreground text-xs">
                      ✓ HTML content saved ({html.length} characters). Click "Edit HTML" to modify.
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      No HTML content yet. Click "Open Editor" to write your HTML.
                    </p>
                  )}
                  {errors.html && <p className="text-destructive text-xs">{errors.html.message}</p>}
                </div>
              )}
              {templateType === EmailTemplateType.TEXT && (
                <div className="space-y-1">
                  {text ? (
                    <p className="text-muted-foreground text-xs">
                      ✓ Plain text content saved ({text.length} characters). Click "Edit Text" to modify.
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      No plain text content yet. Click "Open Editor" to write your text.
                    </p>
                  )}
                  {errors.text && <p className="text-destructive text-xs">{errors.text.message}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Mode Message */}
        {templateType && mode === "create" && (
          <div className="bg-muted/50 rounded-md border p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {(() => {
                  const { icon: Icon } = getTemplateTypeInfo(templateType);
                  return <Icon className="text-muted-foreground mt-0.5 h-5 w-5" />;
                })()}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Template Type Selected</p>
                <p className="text-muted-foreground text-xs">
                  You've selected <strong>{getTemplateTypeInfo(templateType).label}</strong> as your template type.
                  After creating the template, you can edit it to add the actual email content.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3 border-t pt-6">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="min-w-[120px]">
          {isLoading ? (
            <>
              <span className="mr-2">⏳</span>
              Saving...
            </>
          ) : mode === "create" ? (
            "Create Template"
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
