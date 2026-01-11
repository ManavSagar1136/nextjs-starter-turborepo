import { env } from "./schema";

/**
 * Export the validated environment variables
 * This is the main entry point for accessing env vars across the monorepo
 */
export { env };

/**
 * Helper functions for environment checks
 *
 * Note: These functions use process.env.NODE_ENV directly to work in both
 * client and server components. NODE_ENV is always available in Next.js.
 */
export const isDevelopment = (): boolean => {
  // Use process.env.NODE_ENV directly for client compatibility
  // NODE_ENV is always available in Next.js (both client and server)
  return process.env.NODE_ENV === "development";
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === "production";
};

export const isTest = (): boolean => {
  return process.env.NODE_ENV === "test";
};
