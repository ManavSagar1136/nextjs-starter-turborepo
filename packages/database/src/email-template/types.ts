/**
 * @buildbase/database - Email Template Types
 */

import type { EmailTemplate } from "../generated/client";

export type EmailTemplateCategory = "TRANSACTIONAL" | "MARKETING" | "NOTIFICATION" | "SYSTEM" | "CUSTOM";

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
