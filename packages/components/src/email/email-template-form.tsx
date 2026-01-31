"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@buildbase/ui/input";
import { Button } from "@buildbase/ui/button";
import { Textarea } from "@buildbase/ui/textarea";
import { Label } from "@buildbase/ui/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@buildbase/ui/components/ui/select";
import { Checkbox } from "@buildbase/ui/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@buildbase/ui/components/ui/tabs";
import { UnlayerEditor } from "./unlayer-editor";

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

export interface EmailTemplateFormData {
  slug?: string;
  name: string;
  description?: string;
  subject: string;
  html: string;
  text?: string;
  design?: string; // Unlayer design JSON
  category: string;
  isActive?: boolean;
}

export interface EmailTemplateFormProps {
  initialData?: Partial<EmailTemplateFormData & { design?: string }>;
  onSubmit: (data: EmailTemplateFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: "create" | "edit";
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
}: EmailTemplateFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmailTemplateFormData>({
    defaultValues: {
      name: "",
      description: "",
      subject: "",
      html: "",
      text: "",
      design: "",
      category: "TRANSACTIONAL",
      isActive: true,
      ...initialData,
    },
  });

  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");
  const category = watch("category");
  const isActive = watch("isActive");
  const html = watch("html");
  const design = watch("design");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-4">
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
            Create your email template using the visual editor or HTML code
          </p>
        </div>
        <Tabs
          defaultValue="visual"
          className="w-full"
          onValueChange={value => setEditorMode(value as "visual" | "html")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visual">
              Visual Editor <span className="text-destructive ml-1">*</span>
            </TabsTrigger>
            <TabsTrigger value="html">HTML Code</TabsTrigger>
          </TabsList>
          <TabsContent value="visual" className="mt-4">
            <div className="space-y-2">
              <Label>Visual Email Editor</Label>
              <div className="bg-background overflow-hidden rounded-md border">
                <UnlayerEditor
                  initialDesign={design || undefined}
                  initialHtml={html || undefined}
                  onSave={(designJson, htmlContent) => {
                    setValue("design", designJson, { shouldValidate: true });
                    setValue("html", htmlContent, { shouldValidate: true });
                  }}
                  isLoading={isLoading}
                  minHeight="500px"
                />
              </div>
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-muted-foreground text-xs">
                  <strong>Tip:</strong> Use the visual editor to design your email template. The HTML will be
                  automatically generated. You can also use{" "}
                  <code className="bg-background rounded px-1 py-0.5">{"{{variableName}}"}</code> for dynamic content.
                </p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="html" className="mt-4 space-y-2">
            <Label htmlFor="html">HTML Content</Label>
            <Textarea
              id="html"
              placeholder="<h1>Welcome, {{userName}}!</h1><p>Thank you for joining {{appName}}.</p>..."
              className="min-h-[350px] font-mono text-sm"
              {...register("html", { required: "HTML content is required" })}
            />
            {errors.html && <p className="text-destructive text-xs">{errors.html.message}</p>}
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-muted-foreground text-xs">
                <strong>Variables:</strong> Use{" "}
                <code className="bg-background rounded px-1 py-0.5">{"{{variableName}}"}</code> to insert dynamic
                content
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Plain Text Section */}
        <div className="space-y-2">
          <Label htmlFor="text">Plain Text Content (Optional)</Label>
          <Textarea
            id="text"
            placeholder="Welcome, {{userName}}! Thank you for joining {{appName}}..."
            className="min-h-[200px] font-mono text-sm"
            {...register("text")}
          />
          <div className="bg-muted/50 rounded-md p-3">
            <p className="text-muted-foreground text-xs">
              <strong>Optional:</strong> Plain text version for email clients that don't support HTML. Auto-generated
              from HTML if not provided.
            </p>
          </div>
        </div>
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
