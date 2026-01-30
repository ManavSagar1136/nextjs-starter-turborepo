/**
 * @buildbase/logger - Structured logging with Pino
 *
 * Fast, JSON-native logging with built-in redaction for sensitive data.
 *
 * @example
 * ```ts
 * import { createLogger } from '@buildbase/logger';
 *
 * const logger = createLogger({
 *   serviceName: 'my-app',
 *   level: 'info',
 *   redact: ['password', 'apiKey'],
 * });
 *
 * logger.info('Application started');
 * logger.info({ userId: '123' }, 'User logged in');
 * logger.error(new Error('Something broke'), 'Operation failed');
 *
 * // Child loggers for request context
 * const reqLogger = logger.child({ requestId: 'abc-123' });
 * reqLogger.info('Processing request');
 * ```
 */

export { createLogger, createChildLogger } from "./logger.js";
export type { Logger, LoggerConfig, LogContext, LogLevel, NewRelicConfig } from "./types.js";
export { DEFAULT_REDACT_PATHS } from "./types.js";
