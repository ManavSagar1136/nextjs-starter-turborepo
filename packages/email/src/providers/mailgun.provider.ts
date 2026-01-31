/**
 * @buildbase/email - Mailgun Provider
 * Email provider using Mailgun API
 */

import Mailgun from "mailgun.js";
import formData from "form-data";
import type { IMailgunClient } from "mailgun.js/Interfaces";
import type { ProviderType, SendEmailOptions, SendResult, MailgunConfig } from "../core/types.js";
import { ProviderError } from "../core/errors.js";
import { BaseProvider, type DbEmailProvider } from "./base.provider.js";

/**
 * Mailgun email provider
 */
export class MailgunProvider extends BaseProvider {
  public readonly type: ProviderType = "MAILGUN";
  private client: IMailgunClient;
  private domain: string;

  constructor(dbProvider: DbEmailProvider, config: MailgunConfig) {
    super(dbProvider);
    this.domain = config.domain;

    const mailgun = new Mailgun(formData);
    this.client = mailgun.client({
      username: "api",
      key: config.apiKey,
      url: config.region === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net",
    });
  }

  /**
   * Send an email via Mailgun
   */
  async send(options: SendEmailOptions): Promise<SendResult> {
    const trackingId = this.generateTrackingId(options.trackingId);

    try {
      const messageData: Record<string, unknown> = {
        from: this.formatFrom(options.from),
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      // Add optional fields
      if (options.cc?.length) {
        messageData.cc = options.cc;
      }
      if (options.bcc?.length) {
        messageData.bcc = options.bcc;
      }
      if (options.replyTo || this.replyTo) {
        messageData["h:Reply-To"] = this.getReplyTo(options.replyTo);
      }
      if (options.tags?.length) {
        messageData["o:tag"] = options.tags;
      }

      // Custom headers
      if (options.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          messageData[`h:${key}`] = value;
        }
      }

      // Attachments
      if (options.attachments?.length) {
        messageData.attachment = options.attachments.map(a => ({
          filename: a.filename,
          data: typeof a.content === "string" ? Buffer.from(a.content, "base64") : a.content,
        }));
      }

      const result = await this.client.messages.create(
        this.domain,
        messageData as Parameters<typeof this.client.messages.create>[1]
      );

      return this.createSuccessResult(result.id || "", trackingId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new ProviderError(
        `Failed to send email via Mailgun: ${message}`,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Test Mailgun API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Get domain info to verify API key and domain
      await this.client.domains.get(this.domain);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }
}
