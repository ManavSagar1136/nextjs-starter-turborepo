/**
 * @buildbase/email - Email Service
 * Main service for sending emails
 */

import { randomUUID } from "crypto";
import type { PrismaClient } from "@buildbase/database";
import type { SendEmailOptions, SendResult, BulkSendResult } from "../core/types.js";
import type { SendTemplateOptions } from "../templates/types.js";
import type { SendWithQueueOptions, QueueResult, BulkQueueResult } from "../queue/types.js";
import { EmailFactory } from "../factory/email.factory.js";
import { TemplateService } from "../templates/template.service.js";
import { EmailQueue } from "../queue/queue.service.js";

/**
 * Main email service for sending emails
 */
export class EmailService {
  /**
   * Initialize the email service with Prisma client
   * Must be called before using other methods
   */
  static async initialize(prisma: PrismaClient): Promise<void> {
    EmailFactory.initialize(prisma);

    // Initialize queue service
    await EmailQueue.initialize();
  }

  /**
   * Check if the service is initialized
   */
  static isInitialized(): boolean {
    return EmailFactory.isInitialized();
  }

  /**
   * Check if queue is configured
   */
  static isQueueConfigured(): boolean {
    return EmailQueue.configured;
  }

  /**
   * Send a single email (supports queue options)
   */
  static async send(options: SendWithQueueOptions): Promise<SendResult | QueueResult> {
    // Check if should queue
    if (options.queue || options.delay || options.scheduledAt) {
      const { queue, delay, scheduledAt, maxRetries, ...emailOptions } = options;
      return EmailQueue.enqueue(emailOptions, { delay, scheduledAt, maxRetries });
    }

    // Direct send
    return this.sendDirect(options);
  }

  /**
   * Send email directly (no queue)
   */
  static async sendDirect(options: SendEmailOptions): Promise<SendResult> {
    const factory = EmailFactory.getInstance();
    const provider = await factory.getProvider(options.providerId);

    // Generate tracking ID if not provided and tracking not disabled
    const trackingId = options.disableTracking
      ? `notrack_${randomUUID()}`
      : (options.trackingId ?? `trk_${randomUUID().replace(/-/g, "")}`);

    // TODO: Add tracking pixel and link rewriting in Phase 5
    // For now, just pass through

    const result = await provider.send({
      ...options,
      trackingId,
    });

    // Update provider stats
    if (result.success) {
      try {
        await factory.getProviderService().incrementEmailsSent(provider.id);
      } catch {
        // Non-critical - don't fail the send
      }
    }

    return result;
  }

  /**
   * Send email using a specific provider
   */
  static async sendWith(
    providerId: string,
    options: Omit<SendWithQueueOptions, "providerId">
  ): Promise<SendResult | QueueResult> {
    return this.send({ ...options, providerId });
  }

  /**
   * Send multiple emails (supports queue)
   */
  static async sendBulk(
    emails: SendEmailOptions[],
    options?: { providerId?: string; queue?: boolean }
  ): Promise<BulkSendResult | BulkQueueResult> {
    // If queue option is set, use bulk queue
    if (options?.queue && EmailQueue.configured) {
      return EmailQueue.enqueueBulk(emails);
    }

    const factory = EmailFactory.getInstance();
    const provider = await factory.getProvider(options?.providerId);

    // Use provider's bulk send if available
    if (provider.sendBulk) {
      return provider.sendBulk(emails);
    }

    // Fallback: send sequentially
    const successful: SendResult[] = [];
    const failed: Array<{ email: string; error: string }> = [];

    for (const email of emails) {
      const recipientEmail = Array.isArray(email.to) ? (email.to[0] ?? "unknown") : email.to;
      try {
        const result = await this.sendDirect({
          ...email,
          providerId: options?.providerId ?? email.providerId,
        });

        if (result.success) {
          successful.push(result);
        } else {
          failed.push({
            email: recipientEmail,
            error: result.errors?.join(", ") ?? "Unknown error",
          });
        }
      } catch (error) {
        failed.push({
          email: recipientEmail,
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
   * Queue email for delayed sending
   */
  static async delay(email: SendEmailOptions, delay: number | string): Promise<QueueResult> {
    return EmailQueue.delay(email, delay);
  }

  /**
   * Schedule email for specific time
   */
  static async schedule(email: SendEmailOptions, scheduledAt: Date | string): Promise<QueueResult> {
    return EmailQueue.schedule(email, scheduledAt);
  }

  /**
   * Send email using a template by slug
   */
  static async sendTemplate(
    slug: string,
    options: SendTemplateOptions & { queue?: boolean; delay?: number | string; scheduledAt?: Date | string }
  ): Promise<(SendResult | QueueResult) & { templateId: string }> {
    const factory = EmailFactory.getInstance();
    const prisma = (factory as unknown as { providerService: { prisma: PrismaClient } }).providerService?.prisma;

    if (!prisma) {
      throw new Error("EmailService not initialized. Call EmailService.initialize(prisma) first.");
    }

    const templateService = new TemplateService(prisma);
    const rendered = await templateService.renderBySlug(slug, options.variables);

    const emailOptions: SendEmailOptions = {
      to: options.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      from: options.from,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      headers: options.headers,
      providerId: options.providerId,
      disableTracking: options.disableTracking,
    };

    // Check if should queue
    if (options.queue || options.delay || options.scheduledAt) {
      const result = await EmailQueue.enqueue(emailOptions, {
        delay: options.delay,
        scheduledAt: options.scheduledAt,
      });
      return { ...result, templateId: rendered.templateId };
    }

    const result = await this.sendDirect(emailOptions);
    return { ...result, templateId: rendered.templateId };
  }

  /**
   * Send email using a template by ID
   */
  static async sendTemplateById(
    templateId: string,
    options: SendTemplateOptions & { queue?: boolean; delay?: number | string; scheduledAt?: Date | string }
  ): Promise<(SendResult | QueueResult) & { templateId: string }> {
    const factory = EmailFactory.getInstance();
    const prisma = (factory as unknown as { providerService: { prisma: PrismaClient } }).providerService?.prisma;

    if (!prisma) {
      throw new Error("EmailService not initialized. Call EmailService.initialize(prisma) first.");
    }

    const templateService = new TemplateService(prisma);
    const rendered = await templateService.render(templateId, options.variables);

    const emailOptions: SendEmailOptions = {
      to: options.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      from: options.from,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      headers: options.headers,
      providerId: options.providerId,
      disableTracking: options.disableTracking,
    };

    // Check if should queue
    if (options.queue || options.delay || options.scheduledAt) {
      const result = await EmailQueue.enqueue(emailOptions, {
        delay: options.delay,
        scheduledAt: options.scheduledAt,
      });
      return { ...result, templateId: rendered.templateId };
    }

    const result = await this.sendDirect(emailOptions);
    return { ...result, templateId: rendered.templateId };
  }

  /**
   * Get the factory instance for advanced usage
   */
  static getFactory(): EmailFactory {
    return EmailFactory.getInstance();
  }

  /**
   * Get template service for template management
   */
  static getTemplateService(prisma: PrismaClient): TemplateService {
    return new TemplateService(prisma);
  }

  /**
   * Get queue service for queue management
   */
  static getQueue(): typeof EmailQueue {
    return EmailQueue;
  }
}

/**
 * Convenience function for sending a single email
 */
export async function sendEmail(options: SendWithQueueOptions): Promise<SendResult | QueueResult> {
  return EmailService.send(options);
}
