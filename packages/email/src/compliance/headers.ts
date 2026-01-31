/**
 * @buildbase/email - Compliance Headers
 * Add required headers for email compliance
 */

import { randomUUID } from "crypto";
import type { ComplianceHeaders } from "./types.js";

/**
 * Get domain from APP_URL or fallback
 */
function getDomain(): string {
  const appUrl = process.env.APP_URL || "";
  try {
    const url = new URL(appUrl);
    return url.hostname;
  } catch {
    return "example.com";
  }
}

/**
 * Generate a unique Message-ID
 */
export function generateMessageId(): string {
  const uuid = randomUUID().replace(/-/g, "");
  const timestamp = Date.now();
  const domain = getDomain();
  return `${uuid}.${timestamp}@${domain}`;
}

/**
 * Add compliance headers to email
 */
export function addComplianceHeaders(
  existingHeaders: Record<string, string> = {},
  options: {
    unsubscribeUrl: string;
    trackingId: string;
    campaignId?: string;
  }
): Record<string, string> & Partial<ComplianceHeaders> {
  const messageId = generateMessageId();
  const domain = getDomain();

  const headers: Record<string, string> = {
    ...existingHeaders,
    "Message-ID": `<${messageId}>`,
    "List-Unsubscribe": `<${options.unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    "X-Entity-Ref-ID": options.trackingId,
  };

  // Add Feedback-ID if campaign is specified
  if (options.campaignId) {
    headers["Feedback-ID"] = `${options.campaignId}:${options.trackingId}:${domain}`;
  }

  return headers;
}

/**
 * Generate unsubscribe URL
 */
export function generateUnsubscribeUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.APP_URL || "";
  return `${base}/api/email/unsubscribe/${token}`;
}

/**
 * Generate one-click unsubscribe URL (for header)
 */
export function generateOneClickUnsubscribeUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.APP_URL || "";
  return `${base}/api/email/unsubscribe/${token}?oneClick=true`;
}
