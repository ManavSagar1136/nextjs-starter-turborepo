/**
 * @buildbase/email - Template Service
 * CRUD operations for email templates
 */

import type { PrismaClient, EmailTemplate } from "@buildbase/database";
import type {
  CreateTemplateInput,
  UpdateTemplateInput,
  RenderedEmail,
  TemplateVariable,
  VariableValidationResult,
  ListTemplatesOptions,
  PaginatedResult,
  EmailTemplateCategory,
} from "./types.js";
import {
  renderTemplate,
  extractVariables,
  validateVariables,
  applyDefaults,
  htmlToText,
  generateSlug,
} from "./renderer.js";
import { ValidationError } from "../core/errors.js";

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
 * Service for managing email templates
 */
export class TemplateService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new template
   */
  async create(data: CreateTemplateInput, userId?: string): Promise<EmailTemplate> {
    // Generate slug if not provided
    const slug = data.slug || generateSlug(data.name);

    // Check if slug already exists
    const existing = await this.findBySlug(slug);
    if (existing) {
      throw new ValidationError(`Template with slug "${slug}" already exists`, "slug", slug);
    }

    // Extract variables from HTML if not provided
    const variables = data.variables || this.extractAllVariables(data.subject, data.html);

    return this.prisma.emailTemplate.create({
      data: {
        slug,
        name: data.name,
        description: data.description,
        subject: data.subject,
        html: data.html,
        text: data.text,
        design: data.design,
        category: data.category ?? "TRANSACTIONAL",
        tags: data.tags ?? [],
        variables: JSON.stringify(variables),
        workspaceId: data.workspaceId,
        createdById: userId,
      },
    });
  }

  /**
   * Update a template
   */
  async update(id: string, data: UpdateTemplateInput, userId?: string): Promise<EmailTemplate> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new TemplateNotFoundError(id);
    }

    // Re-extract variables if HTML or subject changed
    let variables: TemplateVariable[] | undefined;
    if (data.html || data.subject) {
      const subject = data.subject ?? existing.subject;
      const html = data.html ?? existing.html;
      variables = data.variables || this.extractAllVariables(subject, html);
    }

    return this.prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.subject && { subject: data.subject }),
        ...(data.html && { html: data.html }),
        ...(data.text !== undefined && { text: data.text }),
        ...(data.design !== undefined && { design: data.design }),
        ...(data.category && { category: data.category }),
        ...(data.tags && { tags: data.tags }),
        ...(variables && { variables: JSON.stringify(variables) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        version: { increment: 1 },
        updatedById: userId,
      },
    });
  }

  /**
   * Delete a template
   */
  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new TemplateNotFoundError(id);
    }

    await this.prisma.emailTemplate.delete({ where: { id } });
  }

  /**
   * Find template by ID
   */
  async findById(id: string): Promise<EmailTemplate | null> {
    return this.prisma.emailTemplate.findUnique({ where: { id } });
  }

  /**
   * Find template by slug
   */
  async findBySlug(slug: string): Promise<EmailTemplate | null> {
    return this.prisma.emailTemplate.findUnique({ where: { slug } });
  }

  /**
   * List templates with pagination and filters
   */
  async list(options: ListTemplatesOptions = {}): Promise<PaginatedResult<EmailTemplate>> {
    const { workspaceId, category, isActive, search, page = 1, limit = 20 } = options;

    const where: Record<string, unknown> = {
      workspaceId: workspaceId ?? null,
    };

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.emailTemplate.findMany({
        where,
        orderBy: [{ isDefault: "desc" }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.emailTemplate.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * List templates by category
   */
  async listByCategory(category: EmailTemplateCategory, workspaceId?: string): Promise<EmailTemplate[]> {
    return this.prisma.emailTemplate.findMany({
      where: {
        category,
        workspaceId: workspaceId ?? null,
        isActive: true,
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  }

  /**
   * Duplicate a template
   */
  async duplicate(id: string, newSlug: string, userId?: string): Promise<EmailTemplate> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new TemplateNotFoundError(id);
    }

    // Check if new slug already exists
    const slugExists = await this.findBySlug(newSlug);
    if (slugExists) {
      throw new ValidationError(`Template with slug "${newSlug}" already exists`, "slug", newSlug);
    }

    return this.prisma.emailTemplate.create({
      data: {
        slug: newSlug,
        name: `${existing.name} (Copy)`,
        description: existing.description,
        subject: existing.subject,
        html: existing.html,
        text: existing.text,
        design: existing.design,
        category: existing.category,
        tags: existing.tags,
        variables: existing.variables,
        workspaceId: existing.workspaceId,
        createdById: userId,
        version: 1,
      },
    });
  }

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
   */
  async renderBySlug(slug: string, variables: Record<string, unknown>): Promise<RenderedEmail> {
    const template = await this.findBySlug(slug);
    if (!template) {
      throw new TemplateNotFoundError(slug);
    }

    return this.renderTemplate(template, variables);
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

  // --- Private methods ---

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
