/**
 * @buildbase/email - Email Queue Service
 * Uses @buildbase/qstash for queue operations
 */

import type { SendEmailOptions } from "../core/types.js";
import type { QueueOptions, QueueResult, BulkQueueResult, QueuePayload } from "./types.js";
import { QueueNotConfiguredError, QueueOperationError } from "./errors.js";

/**
 * Email Queue Service
 * Provides delayed, scheduled, and bulk email sending via QStash
 */
export class EmailQueueService {
  private qstashClient: unknown = null;
  private callbackUrl: string = "";
  private isConfigured = false;

  /**
   * Initialize the queue service with QStash client
   * Called by EmailFactory during initialization
   */
  async initialize(): Promise<void> {
    const qstashToken = process.env.QSTASH_TOKEN;
    const appUrl = process.env.APP_URL;

    if (!qstashToken || !appUrl) {
      this.isConfigured = false;
      return;
    }

    try {
      // Dynamic import to avoid bundling issues
      const { createQStashFactory } = await import("@buildbase/qstash/factory");
      const factory = createQStashFactory();
      this.qstashClient = factory.client;
      this.callbackUrl = `${appUrl}/api/email/process`;
      this.isConfigured = true;
    } catch {
      // QStash package not available
      this.isConfigured = false;
    }
  }

  /**
   * Check if queue is configured
   */
  get configured(): boolean {
    return this.isConfigured;
  }

  /**
   * Queue a single email for async sending
   */
  async enqueue(email: SendEmailOptions, options?: QueueOptions): Promise<QueueResult> {
    this.ensureConfigured();

    const delay = options?.delay;
    const scheduledFor = options?.scheduledAt ? new Date(options.scheduledAt) : undefined;

    const payload: QueuePayload = {
      email,
      options,
      queuedAt: new Date().toISOString(),
    };

    try {
      const client = this.qstashClient as {
        publishJSON: (opts: unknown) => Promise<{ messageId: string }>;
      };

      const result = await client.publishJSON({
        url: this.callbackUrl,
        body: payload,
        delay,
        retries: options?.maxRetries ?? 3,
        deduplicationId: options?.deduplicationId,
        contentBasedDeduplication: options?.contentBasedDeduplication,
        callback: options?.callback,
        failureCallback: options?.failureCallback,
      });

      return {
        messageId: result.messageId,
        status: scheduledFor || delay ? "scheduled" : "queued",
        scheduledFor,
      };
    } catch (error) {
      throw new QueueOperationError("Failed to queue email", "enqueue", error instanceof Error ? error : undefined);
    }
  }

  /**
   * Queue email with delay
   */
  async delay(email: SendEmailOptions, delay: number | string): Promise<QueueResult> {
    return this.enqueue(email, { delay });
  }

  /**
   * Schedule email for specific time
   */
  async schedule(email: SendEmailOptions, scheduledAt: Date | string): Promise<QueueResult> {
    // Convert to delay from now
    const targetTime = new Date(scheduledAt);
    const now = new Date();
    const delayMs = targetTime.getTime() - now.getTime();

    if (delayMs <= 0) {
      // Send immediately if scheduled time is in the past
      return this.enqueue(email);
    }

    return this.enqueue(email, {
      delay: delayMs,
      scheduledAt: targetTime,
    });
  }

  /**
   * Queue multiple emails (batched)
   */
  async enqueueBulk(emails: SendEmailOptions[], options?: QueueOptions): Promise<BulkQueueResult> {
    this.ensureConfigured();

    const batchSize = 100;
    const messageIds: string[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map((email, batchIndex) =>
          this.enqueue(email, {
            ...options,
            // Stagger sends to avoid rate limits (100ms between each in batch)
            delay: this.addDelay(options?.delay, batchIndex * 100),
          })
        )
      );

      results.forEach((result, batchIndex) => {
        const globalIndex = i + batchIndex;
        if (result.status === "fulfilled") {
          messageIds.push(result.value.messageId);
        } else {
          errors.push({
            index: globalIndex,
            error: result.reason?.message || "Unknown error",
          });
        }
      });
    }

    return {
      total: emails.length,
      queued: messageIds.length,
      failed: errors.length,
      messageIds,
      errors,
    };
  }

  /**
   * Cancel a scheduled email
   */
  async cancel(messageId: string): Promise<boolean> {
    this.ensureConfigured();

    try {
      const client = this.qstashClient as {
        deleteSchedule: (id: string) => Promise<void>;
      };

      await client.deleteSchedule(messageId);
      return true;
    } catch {
      // Message may already be processed or doesn't exist
      return false;
    }
  }

  // --- Private helpers ---

  private ensureConfigured(): void {
    if (!this.isConfigured) {
      throw new QueueNotConfiguredError();
    }
  }

  private addDelay(base: number | string | undefined, additional: number): number | string {
    if (!base) return additional;

    if (typeof base === "number") {
      return base + additional;
    }

    // Parse string delay and add
    const parsed = this.parseDelay(base);
    if (parsed !== undefined) {
      return parsed + additional;
    }

    return additional;
  }

  private parseDelay(delay: string): number | undefined {
    const match = delay.match(/^(\d+)(ms|s|m|h|d)$/);
    if (!match) return parseInt(delay, 10) || undefined;

    const value = match[1];
    const unit = match[2];
    if (!value || !unit) return undefined;

    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return parseInt(value, 10) * (multipliers[unit] ?? 1);
  }
}

// Singleton instance
let emailQueueInstance: EmailQueueService | null = null;

/**
 * Get or create the email queue service instance
 */
export function getEmailQueue(): EmailQueueService {
  if (!emailQueueInstance) {
    emailQueueInstance = new EmailQueueService();
  }
  return emailQueueInstance;
}

/**
 * Export singleton for convenience
 */
export const EmailQueue = getEmailQueue();
