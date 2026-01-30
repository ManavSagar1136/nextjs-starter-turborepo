/**
 * @buildbase/email - Compliance Types
 */

/**
 * Email preference categories
 */
export interface EmailPreferences {
  /** Marketing emails (promotions, sales) */
  marketing: boolean;
  /** Transactional emails (receipts, confirmations) */
  transactional: boolean;
  /** Newsletter emails */
  newsletter: boolean;
  /** Notification emails */
  notifications: boolean;
  /** Unsubscribed from all emails */
  unsubscribedAll: boolean;
}

/**
 * Default preferences - everything enabled
 */
export const DEFAULT_PREFERENCES: EmailPreferences = {
  marketing: true,
  transactional: true,
  newsletter: true,
  notifications: true,
  unsubscribedAll: false,
};

/**
 * Unsubscribe token data
 */
export interface UnsubscribeToken {
  email: string;
  token: string;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Compliance headers to add to emails
 */
export interface ComplianceHeaders {
  "Message-ID": string;
  "List-Unsubscribe": string;
  "List-Unsubscribe-Post": string;
  "X-Entity-Ref-ID": string;
  "Feedback-ID"?: string;
}
