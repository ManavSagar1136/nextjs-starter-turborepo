/**
 * @buildbase/email - Resend Provider
 * Email provider using Resend API
 */

import { Resend } from "resend";
import type { ProviderType, SendEmailOptions, SendResult, BulkSendResult, ResendConfig } from "../core/types.js";
import { ProviderError } from "../core/errors.js";
import { BaseProvider, type DbEmailProvider } from "./base.provider.js";

/**
 * Resend email provider
 */
export class ResendProvider extends BaseProvider {
  public readonly type: ProviderType = "RESEND";
  private client: Resend;

  constructor(dbProvider: DbEmailProvider, config: ResendConfig) {
    super(dbProvider);
    this.client = new Resend(config.apiKey);
  }

  /**
   * Send an email via Resend
   */
  async send(options: SendEmailOptions): Promise<SendResult> {
    const trackingId = this.generateTrackingId(options.trackingId);

    try {
      const { data, error } = await this.client.emails.send({
        from: this.formatFrom(options.from),
        to: Array.isArray(options.to) ? options.to : [options.to],
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: this.getReplyTo(options.replyTo),
        attachments: options.attachments?.map(a => ({
          filename: a.filename,
          content: typeof a.content === "string" ? a.content : a.content.toString("base64"),
          contentType: a.contentType,
        })),
        headers: options.headers,
        tags: options.tags?.map(t => ({ name: t, value: "true" })),
      });

      if (error) {
        throw new ProviderError(`Resend API error: ${error.message}`, this.name);
      }

      return this.createSuccessResult(data!.id, trackingId);
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new ProviderError(
        `Failed to send email via Resend: ${message}`,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Send bulk emails via Resend batch API
   */
  async sendBulk(emails: SendEmailOptions[]): Promise<BulkSendResult> {
    const successful: SendResult[] = [];
    const failed: Array<{ email: string; error: string }> = [];

    // Resend batch API supports up to 100 emails
    const batchSize = 100;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      try {
        const { data, error } = await this.client.batch.send(
          batch.map(email => ({
            from: this.formatFrom(email.from),
            to: Array.isArray(email.to) ? email.to : [email.to],
            cc: email.cc,
            bcc: email.bcc,
            subject: email.subject,
            html: email.html,
            text: email.text,
            replyTo: this.getReplyTo(email.replyTo),
          }))
        );

        if (error) {
          // Entire batch failed
          for (const email of batch) {
            failed.push({
              email: this.getRecipientString(email.to),
              error: error.message,
            });
          }
        } else if (data) {
          // Process individual results
          data.data.forEach((result, index) => {
            const trackingId = this.generateTrackingId(batch[index]?.trackingId);
            successful.push(this.createSuccessResult(result.id, trackingId));
          });
        }
      } catch (error) {
        // Entire batch failed
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
   * Test Resend API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // List domains to verify API key works
      const { error } = await this.client.domains.list();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }
}
