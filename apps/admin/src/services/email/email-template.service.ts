import { BaseApiController } from "../base";

export interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  description?: string;
  subject: string;
  html: string;
  text?: string;
  design?: string; // Unlayer design JSON
  category: string;
  tags: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateInput {
  slug?: string;
  name: string;
  description?: string;
  subject: string;
  html: string;
  text?: string;
  design?: string; // Unlayer design JSON
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
  design?: string; // Unlayer design JSON
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

  /**
   * Send a test email using this template
   * @param id - Template ID
   * @param to - Recipient email address
   * @param providerId - Optional provider ID (uses default if not provided)
   * @param variables - Optional template variables
   */
  async sendTest(
    id: string,
    to: string,
    providerId?: string,
    variables?: Record<string, unknown>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return (
      await this.post<{ success: boolean; messageId?: string; error?: string }>(
        "/email/send",
        {},
        {},
        {
          to,
          templateId: id,
          providerId,
          variables: variables || {},
        }
      )
    ).data;
  }

  /**
   * Send email using template slug
   * @param slug - Template slug
   * @param to - Recipient email address(es)
   * @param options - Send options (providerId, variables, etc.)
   */
  async sendBySlug(
    slug: string,
    to: string | string[],
    options?: {
      providerId?: string;
      variables?: Record<string, unknown>;
      from?: { email: string; name?: string };
      replyTo?: string;
      cc?: string[];
      bcc?: string[];
      headers?: Record<string, string>;
      disableTracking?: boolean;
    }
  ): Promise<{ success: boolean; messageId?: string; templateId?: string; error?: string }> {
    return (
      await this.post<{ success: boolean; messageId?: string; templateId?: string; error?: string }>(
        "/email/send",
        {},
        {},
        {
          to,
          templateSlug: slug,
          providerId: options?.providerId, // If not provided, API will use default provider
          variables: options?.variables || {},
          from: options?.from,
          replyTo: options?.replyTo,
          cc: options?.cc,
          bcc: options?.bcc,
          headers: options?.headers,
          disableTracking: options?.disableTracking,
        }
      )
    ).data;
  }
}
