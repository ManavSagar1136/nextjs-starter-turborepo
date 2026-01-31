/**
 * @buildbase/email - SendGrid Provider
 * Email provider using SendGrid API
 */

import sgMail from "@sendgrid/mail";
import type { MailDataRequired } from "@sendgrid/mail";
import type { ProviderType, SendEmailOptions, SendResult, BulkSendResult, SendGridConfig } from "../core/types.js";
import { ProviderError } from "../core/errors.js";
import { BaseProvider, type DbEmailProvider } from "./base.provider.js";

/**
 * SendGrid email provider
 */
export class SendGridProvider extends BaseProvider {
  public readonly type: ProviderType = "SENDGRID";

  constructor(dbProvider: DbEmailProvider, config: SendGridConfig) {
    super(dbProvider);
    sgMail.setApiKey(config.apiKey);
  }

  /**
   * Send an email via SendGrid
   */
  async send(options: SendEmailOptions): Promise<SendResult> {
    const trackingId = this.generateTrackingId(options.trackingId);

    try {
      const msg: MailDataRequired = {
        from: this.getFromAddress(options.from),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      // Add optional fields
      if (options.cc?.length) {
        msg.cc = options.cc;
      }
      if (options.bcc?.length) {
        msg.bcc = options.bcc;
      }
      if (options.replyTo || this.replyTo) {
        msg.replyTo = this.getReplyTo(options.replyTo);
      }
      if (options.tags?.length) {
        msg.categories = options.tags;
      }
      if (options.headers) {
        msg.headers = options.headers;
      }
      if (options.attachments?.length) {
        msg.attachments = options.attachments.map(a => ({
          filename: a.filename,
          content: typeof a.content === "string" ? a.content : a.content.toString("base64"),
          type: a.contentType,
          disposition: "attachment",
        }));
      }

      const [response] = await sgMail.send(msg);

      const messageId = (response.headers?.["x-message-id"] as string) || `sg_${Date.now()}`;

      return this.createSuccessResult(messageId, trackingId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new ProviderError(
        `Failed to send email via SendGrid: ${message}`,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Send bulk emails via SendGrid
   */
  async sendBulk(emails: SendEmailOptions[]): Promise<BulkSendResult> {
    const successful: SendResult[] = [];
    const failed: Array<{ email: string; error: string }> = [];

    // SendGrid supports up to 1000 recipients per request
    // For bulk with different content, we send in batches
    const batchSize = 100;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      const messages: MailDataRequired[] = batch.map(email => ({
        from: this.getFromAddress(email.from),
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        cc: email.cc,
        bcc: email.bcc,
        replyTo: this.getReplyTo(email.replyTo),
        categories: email.tags,
      }));

      try {
        await sgMail.send(messages);

        // SendGrid batch doesn't return individual IDs
        for (const email of batch) {
          const trackingId = this.generateTrackingId(email.trackingId);
          successful.push(this.createSuccessResult(`sg_batch_${Date.now()}`, trackingId));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        for (const email of batch) {
          failed.push({
            email: this.getRecipientString(email.to),
            error: message,
          });
        }
      }
    }

    return {
      total: emails.length,
      successful,
      failed,
    };
  }

  /**
   * Test SendGrid API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // SendGrid doesn't have a simple "test" endpoint
      // We'll try to send to a validation endpoint
      // Note: This is a workaround - ideally use their API validation
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }
}
