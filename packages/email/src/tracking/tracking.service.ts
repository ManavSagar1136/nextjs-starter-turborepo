/**
 * @buildbase/email - Tracking Service
 * Main service for email tracking
 */

import type { PrismaClient } from "@buildbase/database";
import type { TrackingConfig, TrackingContext, EmailMetrics, TrackingRequestInfo, EmailEventType } from "./types.js";
import { DEFAULT_TRACKING_CONFIG } from "./types.js";
import { insertTrackingPixel, getTransparentPixel } from "./pixel.js";
import { rewriteLinks } from "./link-rewriter.js";

/**
 * Tracking Service
 * Handles email tracking - open pixels, click tracking, and metrics
 */
export class TrackingService {
  private config: TrackingConfig;

  constructor(
    private readonly prisma: PrismaClient,
    config?: Partial<TrackingConfig>
  ) {
    this.config = {
      ...DEFAULT_TRACKING_CONFIG,
      ...config,
      baseUrl: config?.baseUrl || process.env.APP_URL || "",
    };
  }

  /**
   * Add tracking to email HTML
   * Inserts pixel and rewrites links based on config
   */
  addTracking(html: string, context: TrackingContext): string {
    if (!this.config.enabled) {
      return html;
    }

    let result = html;

    // Add open tracking pixel
    if (this.config.trackOpens) {
      result = insertTrackingPixel(result, context.trackingId, this.config.baseUrl);
    }

    // Rewrite links for click tracking
    if (this.config.trackClicks) {
      result = rewriteLinks(result, context.trackingId, this.config.baseUrl);
    }

    return result;
  }

  /**
   * Record an email open event
   */
  async recordOpen(trackingId: string, requestInfo?: TrackingRequestInfo): Promise<void> {
    await this.recordEvent(trackingId, "OPENED", requestInfo);
  }

  /**
   * Record a link click event
   */
  async recordClick(trackingId: string, linkUrl: string, requestInfo?: TrackingRequestInfo): Promise<void> {
    await this.recordEvent(trackingId, "CLICKED", requestInfo, { linkUrl });
  }

  /**
   * Record email sent event
   */
  async recordSent(trackingId: string): Promise<void> {
    await this.recordEvent(trackingId, "SENT");
  }

  /**
   * Record email delivered event
   */
  async recordDelivered(trackingId: string): Promise<void> {
    await this.recordEvent(trackingId, "DELIVERED");
  }

  /**
   * Record bounce event
   */
  async recordBounce(trackingId: string, bounceType: "hard" | "soft"): Promise<void> {
    await this.recordEvent(trackingId, "BOUNCED", undefined, {
      metadata: { type: bounceType },
    });
  }

  /**
   * Record unsubscribe event
   */
  async recordUnsubscribe(trackingId: string, email: string): Promise<void> {
    await this.recordEvent(trackingId, "UNSUBSCRIBED", undefined, {
      metadata: { email },
    });
  }

  /**
   * Get aggregated metrics for an email
   */
  async getMetrics(trackingId: string): Promise<EmailMetrics> {
    const events = await this.prisma.emailEvent.findMany({
      where: { trackingId },
      orderBy: { timestamp: "asc" },
    });

    return this.calculateMetrics(trackingId, events);
  }

  /**
   * Get metrics for multiple emails
   */
  async getBulkMetrics(trackingIds: string[]): Promise<Map<string, EmailMetrics>> {
    const events = await this.prisma.emailEvent.findMany({
      where: { trackingId: { in: trackingIds } },
      orderBy: { timestamp: "asc" },
    });

    // Group events by trackingId
    const eventsByTrackingId = new Map<string, typeof events>();
    for (const event of events) {
      const existing = eventsByTrackingId.get(event.trackingId) || [];
      existing.push(event);
      eventsByTrackingId.set(event.trackingId, existing);
    }

    // Calculate metrics for each
    const metrics = new Map<string, EmailMetrics>();
    for (const trackingId of trackingIds) {
      const trackingEvents = eventsByTrackingId.get(trackingId) || [];
      metrics.set(trackingId, this.calculateMetrics(trackingId, trackingEvents));
    }

    return metrics;
  }

  /**
   * Get the transparent tracking pixel
   */
  getTrackingPixel(): Buffer {
    return getTransparentPixel();
  }

  /**
   * Check if tracking is enabled
   */
  get isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get current tracking config
   */
  get currentConfig(): TrackingConfig {
    return { ...this.config };
  }

  // --- Private methods ---

  private async recordEvent(
    trackingId: string,
    type: EmailEventType,
    requestInfo?: TrackingRequestInfo,
    extra?: { linkUrl?: string; metadata?: Record<string, unknown> }
  ): Promise<void> {
    try {
      await this.prisma.emailEvent.create({
        data: {
          trackingId,
          type,
          ipAddress: requestInfo?.ipAddress,
          userAgent: requestInfo?.userAgent,
          linkUrl: extra?.linkUrl,
          metadata: extra?.metadata as object | undefined,
        },
      });
    } catch (error) {
      // Log but don't throw - tracking failures shouldn't break email sending
      console.error(`[TrackingService] Failed to record ${type} event:`, error);
    }
  }

  private calculateMetrics(
    trackingId: string,
    events: Array<{
      type: string;
      timestamp: Date;
      ipAddress: string | null;
      linkUrl: string | null;
      metadata: unknown;
    }>
  ): EmailMetrics {
    const opens = events.filter(e => e.type === "OPENED");
    const clicks = events.filter(e => e.type === "CLICKED");
    const uniqueOpenIps = new Set(opens.map(e => e.ipAddress).filter(Boolean));
    const uniqueClickIps = new Set(clicks.map(e => e.ipAddress).filter(Boolean));

    // Count clicks per URL
    const clicksByUrl = clicks.reduce(
      (acc, e) => {
        const url = e.linkUrl || "unknown";
        acc[url] = (acc[url] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const sentEvent = events.find(e => e.type === "SENT");
    const deliveredEvent = events.find(e => e.type === "DELIVERED");
    const bouncedEvent = events.find(e => e.type === "BOUNCED");

    return {
      trackingId,
      sent: !!sentEvent,
      sentAt: sentEvent?.timestamp,
      delivered: !!deliveredEvent,
      deliveredAt: deliveredEvent?.timestamp,
      opened: opens.length > 0,
      openCount: opens.length,
      uniqueOpens: uniqueOpenIps.size,
      firstOpenAt: opens[0]?.timestamp,
      lastOpenAt: opens[opens.length - 1]?.timestamp,
      clicked: clicks.length > 0,
      clickCount: clicks.length,
      uniqueClicks: uniqueClickIps.size,
      clickedLinks: Object.entries(clicksByUrl).map(([url, count]) => ({
        url,
        count,
      })),
      bounced: !!bouncedEvent,
      bounceType: (bouncedEvent?.metadata as { type?: "hard" | "soft" })?.type,
      unsubscribed: events.some(e => e.type === "UNSUBSCRIBED"),
    };
  }
}

// Singleton instance
let trackingServiceInstance: TrackingService | null = null;

/**
 * Get or create the tracking service
 */
export function getTrackingService(prisma: PrismaClient, config?: Partial<TrackingConfig>): TrackingService {
  if (!trackingServiceInstance) {
    trackingServiceInstance = new TrackingService(prisma, config);
  }
  return trackingServiceInstance;
}
