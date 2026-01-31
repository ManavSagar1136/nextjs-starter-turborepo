/**
 * @buildbase/email - Tracking Types
 */

/**
 * Tracking configuration
 */
export interface TrackingConfig {
  /** Tracking is ON by default - set false to disable globally */
  enabled: boolean;
  /** Track opens via pixel - default ON */
  trackOpens: boolean;
  /** Track clicks via link rewriting - default ON */
  trackClicks: boolean;
  /** Base URL for tracking endpoints */
  baseUrl: string;
}

/**
 * Default config - tracking ON for everything
 */
export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
  enabled: true,
  trackOpens: true,
  trackClicks: true,
  baseUrl: process.env.APP_URL || "",
};

/**
 * Context for tracking an email
 */
export interface TrackingContext {
  /** Unique tracking ID for this email */
  trackingId: string;
  /** Recipient email */
  email: string;
  /** Campaign identifier (optional) */
  campaignId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Email event types
 */
export type EmailEventType = "SENT" | "DELIVERED" | "OPENED" | "CLICKED" | "BOUNCED" | "COMPLAINED" | "UNSUBSCRIBED";

/**
 * Email event record
 */
export interface EmailEvent {
  id: string;
  trackingId: string;
  type: EmailEventType;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  linkUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Aggregated email metrics
 */
export interface EmailMetrics {
  trackingId: string;
  sent: boolean;
  sentAt?: Date;
  delivered: boolean;
  deliveredAt?: Date;
  opened: boolean;
  openCount: number;
  uniqueOpens: number;
  firstOpenAt?: Date;
  lastOpenAt?: Date;
  clicked: boolean;
  clickCount: number;
  uniqueClicks: number;
  clickedLinks: Array<{ url: string; count: number }>;
  bounced: boolean;
  bounceType?: "hard" | "soft";
  unsubscribed: boolean;
}

/**
 * Request info for recording events
 */
export interface TrackingRequestInfo {
  ipAddress?: string;
  userAgent?: string;
}
