/**
 * @buildbase/email - Base Provider
 * Abstract base class for all email providers
 */

import { randomUUID } from "crypto";
import type {
  EmailProviderInstance,
  ProviderType,
  SendEmailOptions,
  SendResult,
  BulkSendResult,
  EmailAddress,
} from "../core/types.js";

/**
 * Database record shape for an email provider
 */
export interface DbEmailProvider {
  id: string;
  name: string;
  type: ProviderType;
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;
}

/**
 * Abstract base class for email providers
 */
export abstract class BaseProvider implements EmailProviderInstance {
  public readonly id: string;
  public readonly name: string;
  public abstract readonly type: ProviderType;
  public readonly fromEmail: string;
  public readonly fromName: string;
  protected readonly replyTo?: string;

  constructor(dbProvider: DbEmailProvider) {
    this.id = dbProvider.id;
    this.name = dbProvider.name;
    this.fromEmail = dbProvider.fromEmail;
    this.fromName = dbProvider.fromName;
    this.replyTo = dbProvider.replyTo ?? undefined;
  }

  /**
   * Send a single email - must be implemented by each provider
   */
  abstract send(options: SendEmailOptions): Promise<SendResult>;

  /**
   * Test the connection - must be implemented by each provider
   */
  abstract testConnection(): Promise<{ success: boolean; error?: string }>;

  /**
   * Send bulk emails - default implementation sends sequentially
   */
  async sendBulk(emails: SendEmailOptions[]): Promise<BulkSendResult> {
    const successful: SendResult[] = [];
    const failed: Array<{ email: string; error: string }> = [];

    for (const email of emails) {
      try {
        const result = await this.send(email);
        if (result.success) {
          successful.push(result);
        } else {
          failed.push({
            email: this.getRecipientString(email.to),
            error: result.errors?.join(", ") ?? "Unknown error",
          });
        }
      } catch (error) {
        failed.push({
          email: this.getRecipientString(email.to),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      total: emails.length,
      successful,
      failed,
    };
  }

  /**
   * Format a from address for sending
   */
  protected formatFrom(from?: EmailAddress): string {
    const email = from?.email ?? this.fromEmail;
    const name = from?.name ?? this.fromName;
    return name ? `${name} <${email}>` : email;
  }

  /**
   * Get the from address object
   */
  protected getFromAddress(from?: EmailAddress): EmailAddress {
    return {
      email: from?.email ?? this.fromEmail,
      name: from?.name ?? this.fromName,
    };
  }

  /**
   * Get reply-to address
   */
  protected getReplyTo(replyTo?: string): string | undefined {
    return replyTo ?? this.replyTo;
  }

  /**
   * Generate a tracking ID if not provided
   */
  protected generateTrackingId(providedId?: string): string {
    return providedId ?? `trk_${randomUUID().replace(/-/g, "")}`;
  }

  /**
   * Create a successful send result
   */
  protected createSuccessResult(messageId: string, trackingId: string): SendResult {
    return {
      success: true,
      messageId,
      provider: this.name,
      providerId: this.id,
      timestamp: new Date(),
      trackingId,
    };
  }

  /**
   * Create a failed send result
   */
  protected createFailureResult(errors: string[], trackingId: string): SendResult {
    return {
      success: false,
      messageId: "",
      provider: this.name,
      providerId: this.id,
      timestamp: new Date(),
      trackingId,
      errors,
    };
  }

  /**
   * Get recipient email(s) as string for error reporting
   */
  protected getRecipientString(to: string | string[]): string {
    return Array.isArray(to) ? (to[0] ?? "unknown") : to;
  }
}
