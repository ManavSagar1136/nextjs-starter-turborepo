/**
 * @buildbase/email - Template Types
 *
 * Re-exports CRUD types from @buildbase/database and defines email-specific types
 */

// Re-export CRUD types from database package
export type {
  CreateEmailTemplateInput as CreateTemplateInput,
  UpdateEmailTemplateInput as UpdateTemplateInput,
  TemplateVariable,
  ListEmailTemplatesOptions as ListTemplatesOptions,
  PaginatedEmailTemplates as PaginatedResult,
} from "@buildbase/database";

// Re-export Prisma's EmailTemplateCategory (from generated client via database)
export type { EmailTemplateCategory } from "@buildbase/database";

/**
 * Variable type in a template
 */
export type TemplateVariableType = "string" | "number" | "boolean" | "array" | "object";

/**
 * Rendered email content
 */
export interface RenderedEmail {
  /** Rendered subject */
  subject: string;
  /** Rendered HTML */
  html: string;
  /** Rendered plain text */
  text: string;
  /** Template ID used */
  templateId: string;
  /** Template slug used */
  templateSlug: string;
  /** Variables used for rendering */
  variables: Record<string, unknown>;
  /** Whether this was rendered from a default (fallback) template */
  isDefault?: boolean;
}

/**
 * Options for sending email with template
 */
export interface SendTemplateOptions {
  /** Recipient email(s) */
  to: string | string[];
  /** Variables to interpolate */
  variables: Record<string, unknown>;
  /** Override from address */
  from?: { email: string; name?: string };
  /** Reply-to address */
  replyTo?: string;
  /** CC recipients */
  cc?: string[];
  /** BCC recipients */
  bcc?: string[];
  /** Custom headers */
  headers?: Record<string, string>;
  /** Use specific provider */
  providerId?: string;
  /** Disable tracking */
  disableTracking?: boolean;
}

/**
 * Validation result for template variables
 */
export interface VariableValidationResult {
  valid: boolean;
  missing: string[];
  extra: string[];
  typeErrors: Array<{
    variable: string;
    expected: TemplateVariableType;
    received: string;
  }>;
}
