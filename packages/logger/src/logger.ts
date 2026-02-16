import { env, isDevelopment as envIsDevelopment } from "@buildbase/env";
import pino from "pino";
import type { Logger, LoggerConfig, LogContext, LogLevel, PinoLoggerInstance } from "./types.js";
import { DEFAULT_REDACT_PATHS } from "./types.js";

/**
 * Detect if we're in development mode
 */
const isDevelopment = (): boolean => {
  return envIsDevelopment();
};

/**
 * Try to get New Relic linking metadata for log correlation
 * Returns empty object if New Relic is not available
 */
const getNewRelicLinkingMetadata = (): Record<string, string> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const newrelic = require("newrelic");
    return newrelic.getLinkingMetadata?.() || {};
  } catch {
    return {};
  }
};

/**
 * Build redaction configuration for Pino
 */
const buildRedactConfig = (customPaths: string[] = []): { paths: string[] } => {
  const allPaths = [...DEFAULT_REDACT_PATHS, ...customPaths];
  // Remove duplicates
  const uniquePaths = [...new Set(allPaths)];
  return { paths: uniquePaths };
};

/**
 * Wrap a Pino logger instance with our Logger interface
 */
const wrapPinoLogger = (pinoLogger: PinoLoggerInstance): Logger => {
  const wrapper: Logger = {
    trace(messageOrContext: string | LogContext, contextOrMessage?: LogContext | string): void {
      if (typeof messageOrContext === "string") {
        if (contextOrMessage) {
          pinoLogger.trace(contextOrMessage as LogContext, messageOrContext);
        } else {
          pinoLogger.trace(messageOrContext);
        }
      } else {
        pinoLogger.trace(messageOrContext, contextOrMessage as string);
      }
    },

    debug(messageOrContext: string | LogContext, contextOrMessage?: LogContext | string): void {
      if (typeof messageOrContext === "string") {
        if (contextOrMessage) {
          pinoLogger.debug(contextOrMessage as LogContext, messageOrContext);
        } else {
          pinoLogger.debug(messageOrContext);
        }
      } else {
        pinoLogger.debug(messageOrContext, contextOrMessage as string);
      }
    },

    info(messageOrContext: string | LogContext, contextOrMessage?: LogContext | string): void {
      if (typeof messageOrContext === "string") {
        if (contextOrMessage) {
          pinoLogger.info(contextOrMessage as LogContext, messageOrContext);
        } else {
          pinoLogger.info(messageOrContext);
        }
      } else {
        pinoLogger.info(messageOrContext, contextOrMessage as string);
      }
    },

    warn(messageOrContext: string | LogContext, contextOrMessage?: LogContext | string): void {
      if (typeof messageOrContext === "string") {
        if (contextOrMessage) {
          pinoLogger.warn(contextOrMessage as LogContext, messageOrContext);
        } else {
          pinoLogger.warn(messageOrContext);
        }
      } else {
        pinoLogger.warn(messageOrContext, contextOrMessage as string);
      }
    },

    error(messageOrContextOrError: string | LogContext | Error, contextOrMessage?: LogContext | string): void {
      if (messageOrContextOrError instanceof Error) {
        const err = messageOrContextOrError;
        const message = (contextOrMessage as string) ?? err.message;
        pinoLogger.error({ err }, message);
      } else if (typeof messageOrContextOrError === "string") {
        if (contextOrMessage) {
          pinoLogger.error(contextOrMessage as LogContext, messageOrContextOrError);
        } else {
          pinoLogger.error(messageOrContextOrError);
        }
      } else {
        pinoLogger.error(messageOrContextOrError, contextOrMessage as string);
      }
    },

    fatal(messageOrContextOrError: string | LogContext | Error, contextOrMessage?: LogContext | string): void {
      if (messageOrContextOrError instanceof Error) {
        const err = messageOrContextOrError;
        const message = (contextOrMessage as string) ?? err.message;
        pinoLogger.fatal({ err }, message);
      } else if (typeof messageOrContextOrError === "string") {
        if (contextOrMessage) {
          pinoLogger.fatal(contextOrMessage as LogContext, messageOrContextOrError);
        } else {
          pinoLogger.fatal(messageOrContextOrError);
        }
      } else {
        pinoLogger.fatal(messageOrContextOrError, contextOrMessage as string);
      }
    },

    child(bindings: LogContext): Logger {
      return wrapPinoLogger(pinoLogger.child(bindings));
    },

    isLevelEnabled(level: LogLevel): boolean {
      return pinoLogger.isLevelEnabled(level);
    },

    flush(): void {
      pinoLogger.flush();
    },
  };

  return wrapper;
};

/**
 * Create a new logger instance
 *
 * @example
 * ```ts
 * import { createLogger } from '@buildbase/logger';
 *
 * const logger = createLogger({
 *   serviceName: 'user-app',
 *   level: 'info',
 *   redact: ['password', 'token'],
 * });
 *
 * logger.info('User created', { userId: '123' });
 * logger.error(new Error('Failed'), 'Operation failed');
 *
 * // With New Relic integration
 * const loggerWithNR = createLogger({
 *   serviceName: 'user-app',
 *   newRelic: { enabled: true },
 * });
 * ```
 */
export const createLogger = (config: LoggerConfig): Logger => {
  const { serviceName, level = "info", redact = [], prettyPrint = isDevelopment(), base = {}, newRelic = {} } = config;

  const redactConfig = buildRedactConfig(redact);
  const newRelicEnabled = newRelic.enabled ?? false;

  const pinoOptions: pino.LoggerOptions = {
    name: serviceName,
    level,
    redact: redactConfig,
    base: {
      service: serviceName,
      ...base,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: label => ({ level: label }),
    },
    // Add New Relic linking metadata to each log entry when enabled
    // This adds trace.id and span.id for log correlation
    ...(newRelicEnabled && {
      mixin: () => getNewRelicLinkingMetadata(),
    }),
  };

  // Use pino-pretty transport in development
  if (prettyPrint) {
    const pinoLogger = pino({
      ...pinoOptions,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
    });
    return wrapPinoLogger(pinoLogger);
  }

  // Production: JSON output
  const pinoLogger = pino(pinoOptions);
  return wrapPinoLogger(pinoLogger);
};

/**
 * Create a child logger from an existing logger
 * Useful for adding request-specific context
 *
 * @example
 * ```ts
 * const requestLogger = logger.child({
 *   requestId: 'abc-123',
 *   userId: 'user-456',
 * });
 * requestLogger.info('Processing request');
 * ```
 */
export const createChildLogger = (parent: Logger, bindings: LogContext): Logger => {
  return parent.child(bindings);
};
