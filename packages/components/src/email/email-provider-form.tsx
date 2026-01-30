"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Input } from "@buildbase/ui/input";
import { Button } from "@buildbase/ui/button";
import { Label } from "@buildbase/ui/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@buildbase/ui/components/ui/select";
import { Checkbox } from "@buildbase/ui/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@buildbase/ui/card";

/**
 * Provider types with their configuration fields
 */
const PROVIDER_TYPES = [
  { value: "CONSOLE", label: "Console (Development)", fields: [] },
  {
    value: "SMTP",
    label: "SMTP",
    fields: [
      { name: "host", label: "SMTP Host", type: "text", required: true },
      { name: "port", label: "Port", type: "number", required: true },
      { name: "username", label: "Username", type: "text", required: true },
      { name: "password", label: "Password", type: "password", required: true },
      { name: "secure", label: "Use TLS/SSL", type: "boolean", required: false },
    ],
  },
  {
    value: "RESEND",
    label: "Resend",
    fields: [{ name: "apiKey", label: "API Key", type: "password", required: true }],
  },
  {
    value: "MAILGUN",
    label: "Mailgun",
    fields: [
      { name: "apiKey", label: "API Key", type: "password", required: true },
      { name: "domain", label: "Domain", type: "text", required: true },
      { name: "region", label: "Region", type: "select", required: false, options: ["us", "eu"] },
    ],
  },
  {
    value: "SENDGRID",
    label: "SendGrid",
    fields: [{ name: "apiKey", label: "API Key", type: "password", required: true }],
  },
  {
    value: "SES",
    label: "AWS SES",
    fields: [
      { name: "region", label: "Region", type: "text", required: true },
      { name: "accessKeyId", label: "Access Key ID", type: "text", required: true },
      { name: "secretAccessKey", label: "Secret Access Key", type: "password", required: true },
    ],
  },
] as const;

type ProviderField = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: readonly string[];
};

export interface EmailProviderFormData {
  name: string;
  description?: string;
  type: string;
  config: Record<string, unknown>;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface EmailProviderFormProps {
  initialData?: Partial<EmailProviderFormData>;
  onSubmit: (data: EmailProviderFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

/**
 * Form for creating/editing email providers
 */
export function EmailProviderForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = "create",
}: EmailProviderFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmailProviderFormData>({
    defaultValues: {
      name: "",
      description: "",
      type: "CONSOLE",
      config: {},
      fromName: "",
      fromEmail: "",
      replyTo: "",
      isDefault: false,
      isActive: true,
      ...initialData,
    },
  });

  const providerType = watch("type");
  const isDefault = watch("isDefault");
  const isActive = watch("isActive");
  const config = watch("config");

  const selectedProvider = PROVIDER_TYPES.find(p => p.value === providerType);
  const fields = (selectedProvider?.fields || []) as ProviderField[];

  const handleConfigChange = (field: string, value: unknown) => {
    setValue("config", { ...config, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Provider Name *</Label>
          <Input id="name" placeholder="Production Resend" {...register("name", { required: "Name is required" })} />
          {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Provider Type *</Label>
          <Select
            value={providerType}
            onValueChange={(value: string) => {
              setValue("type", value);
              setValue("config", {}); // Reset config when type changes
            }}
            disabled={mode === "edit"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select provider type" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" placeholder="Primary email provider for production" {...register("description")} />
      </div>

      {/* Provider Configuration */}
      {fields.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{selectedProvider?.label} Configuration</CardTitle>
            <CardDescription className="text-xs">Enter your provider credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map(field => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label} {field.required && "*"}
                </Label>
                {field.type === "boolean" ? (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={field.name}
                      checked={!!config[field.name]}
                      onCheckedChange={checked => handleConfigChange(field.name, checked === true)}
                    />
                    <Label htmlFor={field.name} className="cursor-pointer text-sm">
                      Enable
                    </Label>
                  </div>
                ) : field.type === "select" && field.options ? (
                  <Select
                    value={(config[field.name] as string) || ""}
                    onValueChange={(value: string) => handleConfigChange(field.name, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map(opt => (
                        <SelectItem key={opt} value={opt}>
                          {opt.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    value={(config[field.name] as string) || ""}
                    onChange={e =>
                      handleConfigChange(
                        field.name,
                        field.type === "number" ? parseInt(e.target.value, 10) : e.target.value
                      )
                    }
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* From Address */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromName">From Name *</Label>
          <Input
            id="fromName"
            placeholder="Your App"
            {...register("fromName", { required: "From name is required" })}
          />
          {errors.fromName && <p className="text-destructive text-sm">{errors.fromName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fromEmail">From Email *</Label>
          <Input
            id="fromEmail"
            type="email"
            placeholder="noreply@yourapp.com"
            {...register("fromEmail", { required: "From email is required" })}
          />
          {errors.fromEmail && <p className="text-destructive text-sm">{errors.fromEmail.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="replyTo">Reply-To Email</Label>
        <Input id="replyTo" type="email" placeholder="support@yourapp.com" {...register("replyTo")} />
      </div>

      {/* Status */}
      <div className="flex gap-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isActive"
            checked={isActive}
            onCheckedChange={checked => setValue("isActive", checked === true)}
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Active
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isDefault"
            checked={isDefault}
            onCheckedChange={checked => setValue("isDefault", checked === true)}
          />
          <Label htmlFor="isDefault" className="cursor-pointer">
            Set as Default Provider
          </Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : mode === "create" ? "Create Provider" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
