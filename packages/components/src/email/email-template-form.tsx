"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Input } from "@buildbase/ui/input";
import { Button } from "@buildbase/ui/button";
import { Textarea } from "@buildbase/ui/textarea";
import { Label } from "@buildbase/ui/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@buildbase/ui/components/ui/select";
import { Checkbox } from "@buildbase/ui/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@buildbase/ui/components/ui/tabs";

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
  category: string;
  isActive?: boolean;
}

export interface EmailTemplateFormProps {
  initialData?: Partial<EmailTemplateFormData>;
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
      category: "TRANSACTIONAL",
      isActive: true,
      ...initialData,
    },
  });

  const category = watch("category");
  const isActive = watch("isActive");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name *</Label>
          <Input id="name" placeholder="Welcome Email" {...register("name", { required: "Name is required" })} />
          {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            placeholder="welcome-email (auto-generated if empty)"
            {...register("slug")}
            disabled={mode === "edit"}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" placeholder="Email sent to new users after signup" {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={(value: string) => setValue("category", value)}>
            <SelectTrigger>
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
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <Checkbox
            id="isActive"
            checked={isActive}
            onCheckedChange={checked => setValue("isActive", checked === true)}
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Active
          </Label>
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject">Subject Line *</Label>
        <Input
          id="subject"
          placeholder="Welcome to {{appName}}, {{userName}}!"
          {...register("subject", { required: "Subject is required" })}
        />
        {errors.subject && <p className="text-destructive text-sm">{errors.subject.message}</p>}
        <p className="text-muted-foreground text-xs">Use {"{{variableName}}"} for dynamic content</p>
      </div>

      {/* Content Tabs */}
      <div className="space-y-2">
        <Label>Email Content *</Label>
        <Tabs defaultValue="html" className="w-full">
          <TabsList>
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="text">Plain Text</TabsTrigger>
          </TabsList>
          <TabsContent value="html" className="mt-2">
            <Textarea
              placeholder="<h1>Welcome, {{userName}}!</h1>..."
              className="min-h-[300px] font-mono text-sm"
              {...register("html", { required: "HTML content is required" })}
            />
            {errors.html && <p className="text-destructive text-sm">{errors.html.message}</p>}
          </TabsContent>
          <TabsContent value="text" className="mt-2">
            <Textarea
              placeholder="Welcome, {{userName}}!..."
              className="min-h-[300px] font-mono text-sm"
              {...register("text")}
            />
            <p className="text-muted-foreground mt-1 text-xs">Optional. Auto-generated from HTML if not provided.</p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : mode === "create" ? "Create Template" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
