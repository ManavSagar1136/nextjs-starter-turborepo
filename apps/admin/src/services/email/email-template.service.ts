import { BaseApiController } from "../base";

export interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  description?: string;
  subject: string;
  html: string;
  text?: string;
  category: string;
  tags: string[];
  isActive: boolean;
  isDefault: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateInput {
  slug: string;
  name: string;
  description?: string;
  subject: string;
  html: string;
  text?: string;
  category?: string;
  tags?: string[];
  variables?: unknown;
  workspaceId?: string;
}

export interface UpdateEmailTemplateInput {
  name?: string;
  description?: string;
  subject?: string;
  html?: string;
  text?: string;
  category?: string;
  tags?: string[];
  variables?: unknown;
  isActive?: boolean;
}

export interface PaginatedEmailTemplates {
  docs: EmailTemplate[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
}

export class EmailTemplateApis extends BaseApiController {
  protected urlPath: string = "/email/templates";

  /**
   * List email templates with pagination and filters
   * @param options - Query options (page, limit, category, search, isActive)
   */
  async list(options?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<PaginatedEmailTemplates> {
    const params = options || {};
    return (await this.get(this.urlPath, params)).data;
  }

  /**
   * Get a single email template by ID
   * @param id - Template ID
   */
  async getById(id: string): Promise<EmailTemplate> {
    return (await this.get(`${this.urlPath}/${id}`, {})).data;
  }

  /**
   * Create a new email template
   * @param data - Template data
   */
  async create(data: CreateEmailTemplateInput): Promise<EmailTemplate> {
    return (await this.post<EmailTemplate>(this.urlPath, {}, {}, data)).data;
  }

  /**
   * Update an email template
   * @param id - Template ID
   * @param data - Updated template data
   */
  async update(id: string, data: UpdateEmailTemplateInput): Promise<EmailTemplate> {
    return (await this.patch(`${this.urlPath}/${id}`, {}, {}, data)).data;
  }

  /**
   * Delete an email template
   * @param id - Template ID
   */
  async remove(id: string): Promise<{ success: boolean }> {
    return (await this.delete(`${this.urlPath}/${id}`, {}, {}, {})).data;
  }
}
