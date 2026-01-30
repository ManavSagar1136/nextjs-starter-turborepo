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
      {/* Basic Info Section */}
      <div className="space-y-4">
        <div>
          <h3 className="mb-3 text-sm font-semibold">Basic Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Provider Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Production SMTP"
                {...register("name", { required: "Name is required" })}
                className="w-full"
              />
              {errors.name && <p className="text-destructive mt-1 text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">
                Provider Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={providerType}
                onValueChange={(value: string) => {
                  setValue("type", value);
                  setValue("config", {}); // Reset config when type changes
                }}
                disabled={mode === "edit"}
              >
                <SelectTrigger className="w-full">
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
              {mode === "edit" && (
                <p className="text-muted-foreground mt-1 text-xs">Provider type cannot be changed after creation</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Optional: Add a description for this provider"
            {...register("description")}
            className="w-full"
          />
          <p className="text-muted-foreground text-xs">Helpful for identifying this provider in your list</p>
        </div>
      </div>

      {/* Provider Configuration */}
      {fields.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="mb-1 text-sm font-semibold">{selectedProvider?.label} Configuration</h3>
            <p className="text-muted-foreground text-xs">Enter your provider credentials to connect</p>
          </div>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {fields.map(field => (
                  <div key={field.name} className={`space-y-2 ${field.type === "boolean" ? "md:col-span-2" : ""}`}>
                    <Label htmlFor={field.name} className="text-sm font-medium">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    {field.type === "boolean" ? (
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id={field.name}
                          checked={!!config[field.name]}
                          onCheckedChange={checked => handleConfigChange(field.name, checked === true)}
                        />
                        <Label htmlFor={field.name} className="cursor-pointer text-sm font-normal">
                          Enable {field.label}
                        </Label>
                      </div>
                    ) : field.type === "select" && field.options ? (
                      <Select
                        value={(config[field.name] as string) || ""}
                        onValueChange={(value: string) => handleConfigChange(field.name, value)}
                      >
                        <SelectTrigger className="w-full">
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
                        placeholder={
                          field.type === "password"
                            ? "Enter your " + field.label.toLowerCase()
                            : `Enter ${field.label.toLowerCase()}`
                        }
                        className="w-full"
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* From Address Section */}
      <div className="space-y-4">
        <div>
          <h3 className="mb-1 text-sm font-semibold">Sender Information</h3>
          <p className="text-muted-foreground text-xs">
            Configure the default sender for emails sent through this provider
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fromName">
              From Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fromName"
              placeholder="e.g., Your App Name"
              {...register("fromName", { required: "From name is required" })}
              className="w-full"
            />
            {errors.fromName && <p className="text-destructive mt-1 text-xs">{errors.fromName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromEmail">
              From Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fromEmail"
              type="email"
              placeholder="e.g., noreply@yourapp.com"
              {...register("fromEmail", {
                required: "From email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              className="w-full"
            />
            {errors.fromEmail && <p className="text-destructive mt-1 text-xs">{errors.fromEmail.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="replyTo">Reply-To Email</Label>
          <Input
            id="replyTo"
            type="email"
            placeholder="e.g., support@yourapp.com"
            {...register("replyTo", {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
            className="w-full"
          />
          <p className="text-muted-foreground text-xs">Optional: Where replies should be sent</p>
        </div>
      </div>

      {/* Status Section */}
      <div className="space-y-4">
        <div>
          <h3 className="mb-1 text-sm font-semibold">Provider Settings</h3>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="bg-muted/50 flex items-center space-x-2 rounded-md border p-3">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={checked => setValue("isActive", checked === true)}
            />
            <div className="flex-1">
              <Label htmlFor="isActive" className="cursor-pointer font-medium">
                Active
              </Label>
              <p className="text-muted-foreground text-xs">Enable this provider to send emails</p>
            </div>
          </div>

          <div className="bg-muted/50 flex items-center space-x-2 rounded-md border p-3">
            <Checkbox
              id="isDefault"
              checked={isDefault}
              onCheckedChange={checked => setValue("isDefault", checked === true)}
            />
            <div className="flex-1">
              <Label htmlFor="isDefault" className="cursor-pointer font-medium">
                Default Provider
              </Label>
              <p className="text-muted-foreground text-xs">Use this provider by default for all emails</p>
            </div>
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
            "Create Provider"
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
