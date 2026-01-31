/**
 * App-specific logger instance for the user app
 *
 * @example
 * ```ts
 * import { logger } from '@/lib/logger';
 *
 * logger.info('User logged in', { userId: '123' });
 * logger.error(new Error('Failed'), 'Operation failed');
 *
 * // Create request-scoped logger
 * const reqLogger = logger.child({ requestId: 'abc-123' });
 * reqLogger.info('Processing request');
 * ```
 */

import { createLogger } from "@buildbase/logger";
import { env } from "@buildbase/env";

/**
 * Main logger instance for the user app
 * - Automatically enables New Relic integration when NEW_RELIC_ENABLED=true
 * - Uses LOG_LEVEL from environment (defaults to 'info')
 * - Pretty prints in development mode
 */
export const logger = createLogger({
  serviceName: env.NEW_RELIC_APP_NAME || "user-app",
  level: env.LOG_LEVEL || "info",
  newRelic: {
    enabled: env.NEW_RELIC_ENABLED === "true",
  },
  // Add app-specific base context
  base: {
    app: "user",
  },
});

/**
 * Create a child logger with additional context
 * Use for module-specific logging
 *
 * @example
 * ```ts
 * const authLogger = createModuleLogger('auth');
 * authLogger.info('Login attempt', { email: 'user@example.com' });
 * ```
 */
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

/**
 * Pre-configured module loggers for common use cases
 */
export const loggers = {
  auth: createModuleLogger("auth"),
  api: createModuleLogger("api"),
  db: createModuleLogger("database"),
  cache: createModuleLogger("cache"),
};
