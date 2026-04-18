/**
 * Application-specific cookie base names — no environment prefix, no dependencies.
 *
 * Full cookie name at runtime: `${environment}-${COOKIE_KEYS.AUTH_TOKEN}`
 * e.g. "development-cms-auth-token", "production-cms-csrf"
 *
 * Safe to import anywhere: server, browser (Next.js), and Chrome extensions.
 * Keep this file dependency-free so it stays universally importable.
 */
export const COOKIE_KEYS = {
  AUTH_TOKEN: "cms-auth-token",
  CSRF: "cms-csrf",
  SAAS_SESSION: "cms-saas-session",
} as const;

export type CookieKey = (typeof COOKIE_KEYS)[keyof typeof COOKIE_KEYS];
