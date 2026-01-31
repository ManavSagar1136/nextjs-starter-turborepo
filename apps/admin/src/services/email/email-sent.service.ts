import { BaseApiController } from "../base";

export interface SentEmail {
  id: string;
  trackingId: string;
  to: string[];
  cc: string[];
  bcc: string[];
  from: string;
  replyTo?: string;
  subject: string;
  status: string;
  providerId: string;
  providerName: string;
  templateId?: string;
  messageId?: string;
  sentAt?: string;
  createdAt: string;
}

export interface ListSentEmailsOptions {
  page?: number;
  limit?: number;
  to?: string;
  from?: string;
  subject?: string;
  status?: string;
  providerId?: string;
  templateId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface PaginatedSentEmails {
  emails: SentEmail[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class EmailSentApis extends BaseApiController {
  protected urlPath: string = "/email/sent";

  /**
   * List sent emails with filters and pagination
   * @param options - Query options
   */
  async list(options?: ListSentEmailsOptions): Promise<PaginatedSentEmails> {
    const params = options || {};
    return (await this.get(this.urlPath, params)).data;
  }
}
