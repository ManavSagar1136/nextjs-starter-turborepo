/**
 * @buildbase/email - Template Types
 */

/**
 * Template category enum
 */
export type EmailTemplateCategory =
  | "TRANSACTIONAL"
  | "MARKETING"
  | "NEWSLETTER"
  | "NOTIFICATION"
  | "WELCOME"
  | "VERIFICATION"
  | "PASSWORD_RESET"
  | "INVITATION"
  | "REMINDER"
  | "CUSTOM";

/**
 * Variable type in a template
 */
export type TemplateVariableType = "string" | "number" | "boolean" | "array" | "object";

/**
 * Template variable definition
 */
export interface TemplateVariable {
  /** Variable name (e.g., "userName") */
  name: string;
  /** Variable type */
  type: TemplateVariableType;
  /** Whether the variable is required */
  required: boolean;
  /** Default value if not provided */
  default?: unknown;
  /** Description for documentation */
  description?: string;
}

/**
 * Input for creating a new template
 */
export interface CreateTemplateInput {
  /** URL-friendly slug (auto-generated if not provided) */
  slug?: string;
  /** Display name */
  name: string;
  /** Optional description */
  description?: string;
  /** Subject line (supports {{variables}}) */
  subject: string;
  /** HTML content (supports {{variables}}) */
  html: string;
  /** Plain text fallback */
  text?: string;
  /** JSON design for visual editors */
  design?: string;
  /** Category */
  category?: EmailTemplateCategory;
  /** Tags for organization */
  tags?: string[];
  /** Variable definitions (auto-extracted if not provided) */
  variables?: TemplateVariable[];
  /** Workspace ID for multi-tenant */
  workspaceId?: string;
}

/**
 * Input for updating a template
 */
export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  subject?: string;
  html?: string;
  text?: string;
  design?: string;
  category?: EmailTemplateCategory;
  tags?: string[];
  variables?: TemplateVariable[];
  isActive?: boolean;
}

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

/**
 * List options for templates
 */
export interface ListTemplatesOptions {
  workspaceId?: string;
  category?: EmailTemplateCategory;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
