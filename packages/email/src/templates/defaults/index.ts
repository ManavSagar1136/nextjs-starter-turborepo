/**
 * @buildbase/email - Default Email Templates
 * Fallback templates used when no DB template exists
 */

import type { TemplateVariable } from "./types.js";

// Import JSON templates (resolveJsonModule enabled)
import newsletterWelcome from "./newsletter-welcome.json";
import newsletterUnsubscribe from "./newsletter-unsubscribe.json";
import newsletterAdminNotification from "./newsletter-admin-notification.json";
import contactConfirmation from "./contact-confirmation.json";
import contactAdminNotification from "./contact-admin-notification.json";

/**
 * Default template structure
 */
export interface DefaultTemplate {
  slug: string;
  name: string;
  description: string;
  subject: string;
  html: string;
  text?: string;
  category: string;
  variables: TemplateVariable[];
}

/**
 * Registry of all default templates
 */
export const defaultTemplates: Record<string, DefaultTemplate> = {
  "newsletter-welcome": newsletterWelcome as unknown as DefaultTemplate,
  "newsletter-unsubscribe": newsletterUnsubscribe as unknown as DefaultTemplate,
  "newsletter-admin-notification": newsletterAdminNotification as unknown as DefaultTemplate,
  "contact-confirmation": contactConfirmation as unknown as DefaultTemplate,
  "contact-admin-notification": contactAdminNotification as unknown as DefaultTemplate,
};

/**
 * Get a default template by slug
 */
export function getDefaultTemplate(slug: string): DefaultTemplate | null {
  return defaultTemplates[slug] ?? null;
}

/**
 * Check if a default template exists
 */
export function hasDefaultTemplate(slug: string): boolean {
  return slug in defaultTemplates;
}

/**
 * Get all available default template slugs
 */
export function getDefaultTemplateSlugs(): string[] {
  return Object.keys(defaultTemplates);
}

/**
 * Get all default templates
 */
export function getAllDefaultTemplates(): DefaultTemplate[] {
  return Object.values(defaultTemplates);
}
