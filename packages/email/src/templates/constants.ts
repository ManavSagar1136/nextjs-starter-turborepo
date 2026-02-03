/**
 * @buildbase/email - Template Slug Constants
 * 
 * Use these constants instead of hardcoded strings for template slugs.
 * This makes it easy to:
 * - Add new templates consistently
 * - Refactor/rename templates safely
 * - Get autocomplete in IDEs
 * 
 * Usage:
 * ```ts
 * import { EMAIL_TEMPLATES } from "@buildbase/email";
 * 
 * await EmailService.sendTemplate(EMAIL_TEMPLATES.NEWSLETTER_WELCOME, {
 *   to: email,
 *   variables: { ... }
 * });
 * ```
 */

/**
 * Email template slug constants
 */
export const EMAIL_TEMPLATES = {
  // Newsletter templates
  NEWSLETTER_WELCOME: "newsletter-welcome",
  NEWSLETTER_UNSUBSCRIBE: "newsletter-unsubscribe",
  NEWSLETTER_ADMIN_NOTIFICATION: "newsletter-admin-notification",

  // Contact form templates
  CONTACT_CONFIRMATION: "contact-confirmation",
  CONTACT_ADMIN_NOTIFICATION: "contact-admin-notification",

  // Add more template slugs here as needed
  // Example:
  // PASSWORD_RESET: "password-reset",
  // WELCOME: "welcome",
  // VERIFICATION: "verification",
  // INVITATION: "invitation",
} as const;

/**
 * Type for template slug values
 */
export type EmailTemplateSlug = (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES];

/**
 * Array of all template slugs (useful for validation/iteration)
 */
export const ALL_EMAIL_TEMPLATE_SLUGS = Object.values(EMAIL_TEMPLATES);

/**
 * Check if a string is a valid template slug
 */
export function isValidTemplateSlug(slug: string): slug is EmailTemplateSlug {
  return ALL_EMAIL_TEMPLATE_SLUGS.includes(slug as EmailTemplateSlug);
}
