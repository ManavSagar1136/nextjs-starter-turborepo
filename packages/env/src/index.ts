import { env } from "./schema";

/**
 * Export the validated environment variables
 * This is the main entry point for accessing env vars across the monorepo
 */
export { env };

/**
 * Helper functions for environment checks
 */

export const getEnvironment = (fallback = "development"): string => {
  return process.env.VERCEL_ENV || process.env.NODE_ENV || fallback;
};

export const isProduction = (): boolean => {
  return getEnvironment() === "production";
};

export const isDevelopment = (): boolean => {
  return getEnvironment() === "development";
};

export const isTest = (): boolean => {
  return getEnvironment() === "test";
};
