import { BaseApiController } from "../base";

export interface EmailProvider {
  id: string;
  name: string;
  description?: string;
  type: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  isActive: boolean;
  isDefault: boolean;
  emailsSent: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  config?: Record<string, unknown> | "[encrypted]";
}

export interface CreateEmailProviderInput {
  name: string;
  description?: string;
  type: string;
  config: Record<string, unknown>;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  isDefault?: boolean;
  workspaceId?: string;
}

export interface UpdateEmailProviderInput {
  name?: string;
  description?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  isDefault?: boolean;
  isActive?: boolean;
  config?: Record<string, unknown>;
}

export interface TestProviderResponse {
  success: boolean;
  error?: string;
}

export class EmailProviderApis extends BaseApiController {
  protected urlPath: string = "/email/providers";

  /**
   * List all email providers
   * @param workspaceId - Optional workspace ID filter
   */
  async list(workspaceId?: string): Promise<EmailProvider[]> {
    const params = workspaceId ? { workspaceId } : {};
    return (await this.get(this.urlPath, params)).data;
  }

  /**
   * Get a single email provider by ID
   * @param id - Provider ID
   * @param includeConfig - If true, returns decrypted config (for edit mode)
   */
  async getById(id: string, includeConfig: boolean = false): Promise<EmailProvider> {
    const params = includeConfig ? { includeConfig: "true" } : {};
    return (await this.get(`${this.urlPath}/${id}`, params)).data;
  }

  /**
   * Create a new email provider
   * @param data - Provider data
   */
  async create(data: CreateEmailProviderInput): Promise<EmailProvider> {
    return (await this.post<EmailProvider>(this.urlPath, {}, {}, data)).data;
  }

  /**
   * Update an email provider
   * @param id - Provider ID
   * @param data - Updated provider data
   */
  async update(id: string, data: UpdateEmailProviderInput): Promise<EmailProvider> {
    return (await this.patch(`${this.urlPath}/${id}`, {}, {}, data)).data;
  }

  /**
   * Delete an email provider
   * @param id - Provider ID
   */
  async remove(id: string): Promise<{ success: boolean }> {
    return (await this.delete(`${this.urlPath}/${id}`, {}, {}, {})).data;
  }

  /**
   * Test provider connection
   * @param id - Provider ID
   * @param email - Optional email address to send a real test email
   */
  async testConnection(
    id: string,
    email?: string
  ): Promise<TestProviderResponse & { connectionValid?: boolean; emailSent?: boolean; messageId?: string }> {
    return (
      await this.post<TestProviderResponse & { connectionValid?: boolean; emailSent?: boolean; messageId?: string }>(
        `${this.urlPath}/${id}`,
        { action: "test" },
        {},
        email ? { email } : {}
      )
    ).data;
  }
}
