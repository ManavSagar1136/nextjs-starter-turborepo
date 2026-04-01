/**
 * @buildbase/database - Email Template Types
 */

import type { EmailTemplate, EmailTemplateCategory } from "@prisma/client";

/**
 * Email template type enum
 * Defines the possible types of email templates
 */
export enum EmailTemplateType {
  UNLAYER = "unlayer",
  HTML = "html",
  TEXT = "text",
}

/**
 * Array of all email template type values
 */
export const EMAIL_TEMPLATE_TYPES = Object.values(EmailTemplateType) as EmailTemplateType[];

export interface CreateEmailTemplateInput {
  slug?: string;
  name: string;
  description?: string;
  subject: string;
  html: string;
  text?: string;
  design?: string;
  category?: EmailTemplateCategory;
  tags?: string[];
  variables?: TemplateVariable[];
  workspaceId?: string;
}

export interface UpdateEmailTemplateInput {
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

export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required?: boolean;
  default?: unknown;
  description?: string;
}

export interface ListEmailTemplatesOptions {
  workspaceId?: string;
  category?: EmailTemplateCategory;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedEmailTemplates {
  data: EmailTemplate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
