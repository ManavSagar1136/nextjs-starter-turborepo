/**
 * @buildbase/email - Email Service
 * Main service for sending emails
 */

import { randomUUID } from "crypto";
import type { PrismaClient } from "@buildbase/database";
import { createSentEmail, updateSentEmailByTrackingId } from "@buildbase/database";
import type { SendEmailOptions, SendResult, BulkSendResult } from "../core/types.js";
import type { SendTemplateOptions } from "../templates/types.js";
import type { SendWithQueueOptions, QueueResult, BulkQueueResult } from "../queue/types.js";
import { EmailFactory } from "../factory/email.factory.js";
import { TemplateService } from "../templates/template.service.js";
import { EmailQueue } from "../queue/queue.service.js";
import { getTrackingService } from "../tracking/tracking.service.js";

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
    const prisma = factory.getPrisma();

    // Generate tracking ID if not provided and tracking not disabled
    const trackingId = options.disableTracking
      ? `notrack_${randomUUID()}`
      : (options.trackingId ?? `trk_${randomUUID().replace(/-/g, "")}`);

    // Prepare email options with tracking
    let html = options.html;
    const trackingEnabled = !options.disableTracking && html;

    // Add tracking pixel and link rewriting if tracking is enabled
    if (trackingEnabled) {
      const trackingService = getTrackingService(prisma);
      const recipientEmail = Array.isArray(options.to) ? options.to[0] : options.to;
      html = trackingService.addTracking(html!, {
        trackingId,
        email: recipientEmail ?? "",
      });
    }

    const result = await provider.send({
      ...options,
      html,
      trackingId,
    });

    // Store sent email record
    try {
      const toArray = Array.isArray(options.to) ? options.to : [options.to];
      const ccArray = options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : [];
      const bccArray = options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : [];
      const fromAddress = options.from?.email ?? provider.fromEmail;

      // Check if provider ID is a valid MongoDB ObjectID (24 hex characters)
      // Console provider uses "console-dev" which is not a valid ObjectID
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(provider.id);
      const providerId = isValidObjectId ? provider.id : undefined;

      await createSentEmail(prisma, {
        trackingId,
        to: toArray,
        cc: ccArray,
        bcc: bccArray,
        from: fromAddress,
        replyTo: options.replyTo,
        subject: options.subject,
        html: options.html, // Store original HTML without tracking
        text: options.text,
        providerId,
        providerName: provider.name,
        messageId: result.messageId,
        status: result.success ? "SENT" : "FAILED",
        error: result.errors?.join(", "),
        sentAt: result.success ? new Date() : undefined,
        metadata: options.headers as Record<string, unknown> | undefined,
      });
    } catch {
      // Non-critical - don't fail the send if logging fails
      console.error("[EmailService] Failed to store sent email record");
    }

    // Record SENT event and update provider stats
    if (result.success) {
      // Record tracking event
      if (trackingEnabled) {
        try {
          const trackingService = getTrackingService(prisma);
          await trackingService.recordSent(trackingId);
        } catch {
          // Non-critical - don't fail the send
        }
      }

      // Update provider stats (only for database providers with valid ObjectID)
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(provider.id);
      if (isValidObjectId) {
        try {
          await factory.getProviderService().incrementEmailsSent(provider.id);
        } catch {
          // Non-critical - don't fail the send
        }
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
    const prisma = factory.getPrisma();
    const trackingService = getTrackingService(prisma);

    // Use provider's bulk send if available
    if (provider.sendBulk) {
      // Pre-process emails to add tracking and generate trackingIds
      const processedEmails: (SendEmailOptions & { _originalEmail: SendEmailOptions })[] = emails.map(email => {
        const trackingId = email.disableTracking
          ? `notrack_${randomUUID()}`
          : (email.trackingId ?? `trk_${randomUUID().replace(/-/g, "")}`);

        let html = email.html;
        if (!email.disableTracking && html) {
          const recipientEmail = Array.isArray(email.to) ? email.to[0] : email.to;
          html = trackingService.addTracking(html, {
            trackingId,
            email: recipientEmail ?? "",
          });
        }

        return { ...email, html, trackingId, _originalEmail: email };
      });

      const result = await provider.sendBulk(processedEmails);

      // Store sent email records and record SENT events
      for (const success of result.successful) {
        if (!success?.trackingId) continue;

        const originalEmail = processedEmails.find(e => e.trackingId === success.trackingId)?._originalEmail;

        if (success.trackingId) {
          // Store sent email record
          try {
            const toArray = originalEmail
              ? Array.isArray(originalEmail.to)
                ? originalEmail.to
                : [originalEmail.to]
              : [];
            const ccArray = originalEmail?.cc
              ? Array.isArray(originalEmail.cc)
                ? originalEmail.cc
                : [originalEmail.cc]
              : [];
            const bccArray = originalEmail?.bcc
              ? Array.isArray(originalEmail.bcc)
                ? originalEmail.bcc
                : [originalEmail.bcc]
              : [];
            const fromAddress = originalEmail?.from?.email ?? provider.fromEmail;

            // Check if provider ID is a valid MongoDB ObjectID (24 hex characters)
            // Console provider uses "console-dev" which is not a valid ObjectID
            const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(provider.id);
            const providerId = isValidObjectId ? provider.id : undefined;

            await createSentEmail(prisma, {
              trackingId: success.trackingId,
              to: toArray,
              cc: ccArray,
              bcc: bccArray,
              from: fromAddress,
              replyTo: originalEmail?.replyTo,
              subject: originalEmail?.subject ?? "",
              html: originalEmail?.html,
              text: originalEmail?.text,
              providerId,
              providerName: provider.name,
              messageId: success.messageId,
              status: "SENT",
              sentAt: new Date(),
            });
          } catch {
            // Non-critical - don't fail the operation
          }

          // Record tracking event
          if (!success.trackingId.startsWith("notrack_")) {
            try {
              await trackingService.recordSent(success.trackingId);
            } catch {
              // Non-critical - don't fail the operation
            }
          }
        }
      }

      return result;
    }

    // Fallback: send sequentially (uses sendDirect which has tracking)
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
