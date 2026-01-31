/**
 * @buildbase/email - Nodemailer Provider
 * SMTP email provider using Nodemailer
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { ProviderType, SendEmailOptions, SendResult, SmtpConfig } from "../core/types.js";
import { ProviderError } from "../core/errors.js";
import { BaseProvider, type DbEmailProvider } from "./base.provider.js";

/**
 * Nodemailer/SMTP email provider
 */
export class NodemailerProvider extends BaseProvider {
  public readonly type: ProviderType = "SMTP";
  private transporter: Transporter;
  private config: SmtpConfig;

  constructor(dbProvider: DbEmailProvider, config: SmtpConfig) {
    super(dbProvider);
    this.config = config;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
      pool: true, // Use connection pooling for better performance
      maxConnections: 5,
      maxMessages: 100,
    });
  }

  /**
   * Send an email via SMTP
   */
  async send(options: SendEmailOptions): Promise<SendResult> {
    const trackingId = this.generateTrackingId(options.trackingId);

    try {
      const info = await this.transporter.sendMail({
        from: this.formatFrom(options.from),
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        cc: options.cc?.join(", "),
        bcc: options.bcc?.join(", "),
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: this.getReplyTo(options.replyTo),
        attachments: options.attachments?.map(a => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
        headers: options.headers,
      });

      return this.createSuccessResult(info.messageId, trackingId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new ProviderError(
        `Failed to send email via SMTP: ${message}`,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Test SMTP connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.transporter.verify();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  /**
   * Close the transporter (cleanup)
   */
  close(): void {
    this.transporter.close();
  }
}
