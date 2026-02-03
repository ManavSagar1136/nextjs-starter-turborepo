/**
 * @buildbase/email - Template Service
 * Rendering and template operations (uses @buildbase/database for CRUD)
 */

import type { PrismaClient, EmailTemplate } from "@buildbase/database";
import {
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getEmailTemplateById,
  getEmailTemplateBySlug,
  listEmailTemplates,
  listEmailTemplatesByCategory,
  duplicateEmailTemplate,
  type CreateEmailTemplateInput,
  type UpdateEmailTemplateInput,
  type ListEmailTemplatesOptions,
  type PaginatedEmailTemplates,
  type TemplateVariable,
  type EmailTemplateCategory,
} from "@buildbase/database";
import type { RenderedEmail, VariableValidationResult } from "./types.js";
import { renderTemplate, extractVariables, validateVariables, applyDefaults, htmlToText } from "./renderer.js";
import { getDefaultTemplate, hasDefaultTemplate, getAllDefaultTemplates, type DefaultTemplate } from "./defaults/index.js";

/**
 * Error thrown when template is not found
 */
export class TemplateNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Email template not found: ${identifier}`);
    this.name = "TemplateNotFoundError";
  }
}

/**
 * Error thrown when required variables are missing
 */
export class MissingVariablesError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Missing required template variables: ${missing.join(", ")}`);
    this.name = "MissingVariablesError";
  }
}

/**
 * Service for managing and rendering email templates
 */
export class TemplateService {
  constructor(private readonly prisma: PrismaClient) {}

  // ===== CRUD Operations (delegated to @buildbase/database) =====

  /**
   * Create a new template
   */
  async create(data: CreateEmailTemplateInput, userId?: string): Promise<EmailTemplate> {
    // Extract variables from HTML if not provided
    const variables = data.variables || this.extractAllVariables(data.subject, data.html);
    return createEmailTemplate(this.prisma, { ...data, variables }, userId);
  }

  /**
   * Update a template
   */
  async update(id: string, data: UpdateEmailTemplateInput, userId?: string): Promise<EmailTemplate> {
    // Re-extract variables if HTML or subject changed
    if ((data.html || data.subject) && !data.variables) {
      const existing = await this.findById(id);
      if (existing) {
        const subject = data.subject ?? existing.subject;
        const html = data.html ?? existing.html;
        data.variables = this.extractAllVariables(subject, html);
      }
    }
    return updateEmailTemplate(this.prisma, id, data, userId);
  }

  /**
   * Delete a template
   */
  async delete(id: string): Promise<void> {
    return deleteEmailTemplate(this.prisma, id);
  }

  /**
   * Find template by ID
   */
  async findById(id: string): Promise<EmailTemplate | null> {
    return getEmailTemplateById(this.prisma, id);
  }

  /**
   * Find template by slug
   */
  async findBySlug(slug: string): Promise<EmailTemplate | null> {
    return getEmailTemplateBySlug(this.prisma, slug);
  }

  /**
   * List templates with pagination and filters
   */
  async list(options: ListEmailTemplatesOptions = {}): Promise<PaginatedEmailTemplates> {
    return listEmailTemplates(this.prisma, options);
  }

  /**
   * List templates by category
   */
  async listByCategory(category: EmailTemplateCategory, workspaceId?: string): Promise<EmailTemplate[]> {
    return listEmailTemplatesByCategory(this.prisma, category, workspaceId);
  }

  /**
   * Duplicate a template
   */
  async duplicate(id: string, newSlug: string, userId?: string): Promise<EmailTemplate> {
    return duplicateEmailTemplate(this.prisma, id, newSlug, userId);
  }

  // ===== Rendering Operations (email package logic) =====

  /**
   * Render a template with variables
   */
  async render(templateId: string, variables: Record<string, unknown>): Promise<RenderedEmail> {
    const template = await this.findById(templateId);
    if (!template) {
      throw new TemplateNotFoundError(templateId);
    }

    return this.renderTemplate(template, variables);
  }

  /**
   * Render a template by slug
   * Falls back to default template if not found in DB
   */
  async renderBySlug(slug: string, variables: Record<string, unknown>): Promise<RenderedEmail> {
    // First try DB
    const template = await this.findBySlug(slug);
    if (template) {
      return this.renderTemplate(template, variables);
    }

    // Fallback to default template
    const defaultTemplate = getDefaultTemplate(slug);
    if (defaultTemplate) {
      return this.renderDefaultTemplate(defaultTemplate, variables);
    }

    throw new TemplateNotFoundError(slug);
  }

  /**
   * Preview a template with sample data
   */
  async preview(templateId: string, sampleData?: Record<string, unknown>): Promise<RenderedEmail> {
    const template = await this.findById(templateId);
    if (!template) {
      throw new TemplateNotFoundError(templateId);
    }

    // Generate sample data if not provided
    const variables = sampleData || this.generateSampleData(template);

    return this.renderTemplate(template, variables);
  }

  /**
   * Validate variables for a template
   */
  async validateTemplateVariables(
    templateId: string,
    variables: Record<string, unknown>
  ): Promise<VariableValidationResult> {
    const template = await this.findById(templateId);
    if (!template) {
      throw new TemplateNotFoundError(templateId);
    }

    const templateVars = this.parseVariables(template);
    return validateVariables(templateVars, variables);
  }

  /**
   * Get variables defined in a template
   */
  async getVariables(templateId: string): Promise<TemplateVariable[]> {
    const template = await this.findById(templateId);
    if (!template) {
      throw new TemplateNotFoundError(templateId);
    }

    return this.parseVariables(template);
  }

  // ===== Default Template Methods =====

  /**
   * Check if a default template exists for a slug
   */
  hasDefaultTemplate(slug: string): boolean {
    return hasDefaultTemplate(slug);
  }

  /**
   * Get all available default templates
   */
  getDefaultTemplates(): DefaultTemplate[] {
    return getAllDefaultTemplates();
  }

  /**
   * Copy a default template to the database for customization
   */
  async copyDefaultToDb(slug: string, userId?: string): Promise<EmailTemplate> {
    const defaultTemplate = getDefaultTemplate(slug);
    if (!defaultTemplate) {
      throw new TemplateNotFoundError(`Default template not found: ${slug}`);
    }

    // Check if already exists in DB
    const existing = await this.findBySlug(slug);
    if (existing) {
      return existing;
    }

    // Create in DB
    return this.create(
      {
        slug: defaultTemplate.slug,
        name: defaultTemplate.name,
        description: defaultTemplate.description,
        subject: defaultTemplate.subject,
        html: defaultTemplate.html,
        text: defaultTemplate.text,
        category: defaultTemplate.category as EmailTemplateCategory,
        variables: defaultTemplate.variables,
      },
      userId
    );
  }

  /**
   * Copy all default templates to the database
   */
  async copyAllDefaultsToDb(userId?: string): Promise<EmailTemplate[]> {
    const defaults = getAllDefaultTemplates();
    const results: EmailTemplate[] = [];

    for (const template of defaults) {
      const created = await this.copyDefaultToDb(template.slug, userId);
      results.push(created);
    }

    return results;
  }

  // ===== Private Methods =====

  /**
   * Render a default template (not from DB)
   */
  private renderDefaultTemplate(template: DefaultTemplate, variables: Record<string, unknown>): RenderedEmail {
    const templateVars = template.variables;

    // Validate variables
    const validation = validateVariables(templateVars, variables);
    if (!validation.valid && validation.missing.length > 0) {
      throw new MissingVariablesError(validation.missing);
    }

    // Apply defaults
    const finalVars = applyDefaults(templateVars, variables);

    // Render subject and HTML
    const subject = renderTemplate(template.subject, finalVars);
    const html = renderTemplate(template.html, finalVars);

    // Render or generate text
    const text = template.text ? renderTemplate(template.text, finalVars) : htmlToText(html);

    return {
      subject,
      html,
      text,
      templateId: `default:${template.slug}`,
      templateSlug: template.slug,
      variables: finalVars,
      isDefault: true,
    };
  }

  /**
   * Render a template entity
   */
  private renderTemplate(template: EmailTemplate, variables: Record<string, unknown>): RenderedEmail {
    const templateVars = this.parseVariables(template);

    // Validate variables
    const validation = validateVariables(templateVars, variables);
    if (!validation.valid && validation.missing.length > 0) {
      throw new MissingVariablesError(validation.missing);
    }

    // Apply defaults
    const finalVars = applyDefaults(templateVars, variables);

    // Render subject and HTML
    const subject = renderTemplate(template.subject, finalVars);
    const html = renderTemplate(template.html, finalVars);

    // Render or generate text
    const text = template.text ? renderTemplate(template.text, finalVars) : htmlToText(html);

    return {
      subject,
      html,
      text,
      templateId: template.id,
      templateSlug: template.slug,
      variables: finalVars,
    };
  }

  /**
   * Parse variables from template entity
   */
  private parseVariables(template: EmailTemplate): TemplateVariable[] {
    try {
      return JSON.parse(template.variables) as TemplateVariable[];
    } catch {
      return [];
    }
  }

  /**
   * Extract variables from subject and HTML
   */
  private extractAllVariables(subject: string, html: string): TemplateVariable[] {
    const subjectVars = extractVariables(subject);
    const htmlVars = extractVariables(html);

    // Merge and deduplicate
    const merged = new Map<string, TemplateVariable>();

    for (const v of [...subjectVars, ...htmlVars]) {
      if (!merged.has(v.name)) {
        merged.set(v.name, v);
      }
    }

    return Array.from(merged.values());
  }

  /**
   * Generate sample data for preview
   */
  private generateSampleData(template: EmailTemplate): Record<string, unknown> {
    const variables = this.parseVariables(template);
    const sampleData: Record<string, unknown> = {};

    for (const v of variables) {
      if (v.default !== undefined) {
        sampleData[v.name] = v.default;
      } else {
        switch (v.type) {
          case "string":
            sampleData[v.name] = `[${v.name}]`;
            break;
          case "number":
            sampleData[v.name] = 123;
            break;
          case "boolean":
            sampleData[v.name] = true;
            break;
          case "array":
            sampleData[v.name] = [{ item: "Sample item 1" }, { item: "Sample item 2" }];
            break;
          case "object":
            sampleData[v.name] = { key: "value" };
            break;
        }
      }
    }

    return sampleData;
  }
}
