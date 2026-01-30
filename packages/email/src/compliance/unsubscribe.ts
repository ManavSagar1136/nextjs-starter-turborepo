/**
 * @buildbase/email - Unsubscribe Service
 * Handle email unsubscribe functionality
 */

import { createHash, randomBytes } from "crypto";
import type { PrismaClient } from "@buildbase/database";
import type { EmailPreferences, UnsubscribeToken } from "./types.js";
import { DEFAULT_PREFERENCES } from "./types.js";

/**
 * Generate a secure unsubscribe token
 */
export function generateUnsubscribeToken(email: string): string {
  const random = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(`${email}:${random}:${Date.now()}`).digest("hex").slice(0, 32);
  return `unsub_${hash}`;
}

/**
 * Unsubscribe Service
 * Manages email preferences and unsubscribe functionality
 */
export class UnsubscribeService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Get or create preferences for an email
   */
  async getPreferences(email: string): Promise<EmailPreferences & { token: string }> {
    let preference = await this.prisma.emailPreference.findUnique({
      where: { email },
    });

    if (!preference) {
      const token = generateUnsubscribeToken(email);
      preference = await this.prisma.emailPreference.create({
        data: {
          email,
          token,
          ...DEFAULT_PREFERENCES,
        },
      });
    }

    return {
      marketing: preference.marketing,
      transactional: preference.transactional,
      newsletter: preference.newsletter,
      notifications: preference.notifications ?? true,
      unsubscribedAll: preference.unsubscribedAll,
      token: preference.token,
    };
  }

  /**
   * Get preferences by token
   */
  async getPreferencesByToken(token: string): Promise<(EmailPreferences & { email: string }) | null> {
    const preference = await this.prisma.emailPreference.findUnique({
      where: { token },
    });

    if (!preference) {
      return null;
    }

    return {
      email: preference.email,
      marketing: preference.marketing,
      transactional: preference.transactional,
      newsletter: preference.newsletter,
      notifications: preference.notifications ?? true,
      unsubscribedAll: preference.unsubscribedAll,
    };
  }

  /**
   * Update preferences
   */
  async updatePreferences(token: string, updates: Partial<EmailPreferences>): Promise<EmailPreferences | null> {
    try {
      const updated = await this.prisma.emailPreference.update({
        where: { token },
        data: updates,
      });

      return {
        marketing: updated.marketing,
        transactional: updated.transactional,
        newsletter: updated.newsletter,
        notifications: updated.notifications ?? true,
        unsubscribedAll: updated.unsubscribedAll,
      };
    } catch {
      return null;
    }
  }

  /**
   * Unsubscribe from all emails
   */
  async unsubscribeAll(token: string): Promise<boolean> {
    try {
      await this.prisma.emailPreference.update({
        where: { token },
        data: {
          unsubscribedAll: true,
          marketing: false,
          newsletter: false,
          notifications: false,
          // Keep transactional true - legally required
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Unsubscribe from a specific category
   */
  async unsubscribeCategory(
    token: string,
    category: keyof Omit<EmailPreferences, "unsubscribedAll">
  ): Promise<boolean> {
    try {
      await this.prisma.emailPreference.update({
        where: { token },
        data: { [category]: false },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if an email can receive a specific category
   */
  async canReceive(email: string, category: keyof Omit<EmailPreferences, "unsubscribedAll">): Promise<boolean> {
    const prefs = await this.getPreferences(email);

    // If unsubscribed from all, only transactional allowed
    if (prefs.unsubscribedAll) {
      return category === "transactional";
    }

    return prefs[category];
  }

  /**
   * Re-subscribe (opt back in)
   */
  async resubscribe(
    token: string,
    categories?: Array<keyof Omit<EmailPreferences, "unsubscribedAll">>
  ): Promise<boolean> {
    try {
      const updates: Partial<EmailPreferences> = {
        unsubscribedAll: false,
      };

      if (categories) {
        for (const cat of categories) {
          updates[cat] = true;
        }
      } else {
        // Resubscribe to all
        updates.marketing = true;
        updates.newsletter = true;
        updates.notifications = true;
      }

      await this.prisma.emailPreference.update({
        where: { token },
        data: updates,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate an unsubscribe URL for an email
   */
  async getUnsubscribeUrl(email: string, baseUrl?: string): Promise<string> {
    const prefs = await this.getPreferences(email);
    const base = baseUrl || process.env.APP_URL || "";
    return `${base}/api/email/unsubscribe/${prefs.token}`;
  }
}

// Singleton instance
let unsubscribeServiceInstance: UnsubscribeService | null = null;

/**
 * Get or create the unsubscribe service
 */
export function getUnsubscribeService(prisma: PrismaClient): UnsubscribeService {
  if (!unsubscribeServiceInstance) {
    unsubscribeServiceInstance = new UnsubscribeService(prisma);
  }
  return unsubscribeServiceInstance;
}
