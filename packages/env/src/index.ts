import { env } from "./schema";

/**
 * Export the validated environment variables
 * This is the main entry point for accessing env vars across the monorepo
 */
export { env };

/**
 * Helper functions for environment checks
 */
export const isDevelopment = (): boolean => {
  return env.NODE_ENV === "development";
};

export const isProduction = (): boolean => {
  return env.NODE_ENV === "production";
};

export const isTest = (): boolean => {
  return env.NODE_ENV === "test";
};
