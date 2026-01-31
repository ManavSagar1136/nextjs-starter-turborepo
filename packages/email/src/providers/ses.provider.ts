/**
 * @buildbase/email - AWS SES Provider
 * Email provider using AWS Simple Email Service
 */

import {
  SESClient,
  SendEmailCommand,
  SendRawEmailCommand,
  GetIdentityVerificationAttributesCommand,
} from "@aws-sdk/client-ses";
import type { ProviderType, SendEmailOptions, SendResult, SesConfig } from "../core/types.js";
import { ProviderError } from "../core/errors.js";
import { BaseProvider, type DbEmailProvider } from "./base.provider.js";

/**
 * AWS SES email provider
 */
export class SesProvider extends BaseProvider {
  public readonly type: ProviderType = "SES";
  private client: SESClient;

  constructor(dbProvider: DbEmailProvider, config: SesConfig) {
    super(dbProvider);
    this.client = new SESClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * Send an email via AWS SES
   */
  async send(options: SendEmailOptions): Promise<SendResult> {
    const trackingId = this.generateTrackingId(options.trackingId);

    try {
      // If there are attachments, use raw email
      if (options.attachments?.length) {
        return this.sendRawEmail(options, trackingId);
      }

      // Simple email without attachments
      const command = new SendEmailCommand({
        Source: this.formatFrom(options.from),
        Destination: {
          ToAddresses: Array.isArray(options.to) ? options.to : [options.to],
          CcAddresses: options.cc,
          BccAddresses: options.bcc,
        },
        Message: {
          Subject: { Data: options.subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: options.html, Charset: "UTF-8" },
            ...(options.text && {
              Text: { Data: options.text, Charset: "UTF-8" },
            }),
          },
        },
        ReplyToAddresses: this.getReplyTo(options.replyTo) ? [this.getReplyTo(options.replyTo)!] : undefined,
        Tags: options.tags?.map(t => ({ Name: t, Value: "true" })),
      });

      const response = await this.client.send(command);

      return this.createSuccessResult(response.MessageId || "", trackingId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new ProviderError(
        `Failed to send email via AWS SES: ${message}`,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Send raw email (supports attachments)
   */
  private async sendRawEmail(options: SendEmailOptions, trackingId: string): Promise<SendResult> {
    const boundary = `----=_Part_${Date.now()}`;
    const from = this.formatFrom(options.from);
    const to = Array.isArray(options.to) ? options.to.join(", ") : options.to;

    // Build MIME message
    let rawMessage = `From: ${from}\r\n`;
    rawMessage += `To: ${to}\r\n`;
    if (options.cc?.length) {
      rawMessage += `Cc: ${options.cc.join(", ")}\r\n`;
    }
    rawMessage += `Subject: ${options.subject}\r\n`;
    if (options.replyTo || this.replyTo) {
      rawMessage += `Reply-To: ${this.getReplyTo(options.replyTo)}\r\n`;
    }
    rawMessage += `MIME-Version: 1.0\r\n`;
    rawMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

    // HTML part
    rawMessage += `--${boundary}\r\n`;
    rawMessage += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
    rawMessage += `${options.html}\r\n\r\n`;

    // Text part
    if (options.text) {
      rawMessage += `--${boundary}\r\n`;
      rawMessage += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
      rawMessage += `${options.text}\r\n\r\n`;
    }

    // Attachments
    for (const attachment of options.attachments || []) {
      const content =
        typeof attachment.content === "string" ? attachment.content : attachment.content.toString("base64");

      rawMessage += `--${boundary}\r\n`;
      rawMessage += `Content-Type: ${attachment.contentType || "application/octet-stream"}; name="${attachment.filename}"\r\n`;
      rawMessage += `Content-Transfer-Encoding: base64\r\n`;
      rawMessage += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n\r\n`;
      rawMessage += `${content}\r\n\r\n`;
    }

    rawMessage += `--${boundary}--`;

    const command = new SendRawEmailCommand({
      RawMessage: {
        Data: Buffer.from(rawMessage),
      },
    });

    const response = await this.client.send(command);

    return this.createSuccessResult(response.MessageId || "", trackingId);
  }

  /**
   * Test AWS SES connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify we can access SES by checking identity verification status
      const command = new GetIdentityVerificationAttributesCommand({
        Identities: [this.fromEmail],
      });
      await this.client.send(command);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }
}
