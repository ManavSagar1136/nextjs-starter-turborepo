import type { Logger as PinoLogger, Level } from "pino";

/**
 * Log levels supported by the logger
 */
export type LogLevel = Level;

/**
 * Configuration for creating a logger instance
 */
export interface LoggerConfig {
  /** Service name for log identification */
  serviceName: string;
  /** Minimum log level (default: 'info') */
  level?: LogLevel;
  /** Fields to redact from logs (e.g., ['password', 'token']) */
  redact?: string[];
  /** Enable pretty printing (default: true in development) */
  prettyPrint?: boolean;
  /** Additional base context to include in all logs */
  base?: Record<string, unknown>;
}

/**
 * Context that can be passed to log methods
 */
export type LogContext = Record<string, unknown>;

/**
 * Logger interface for application use
 */
export interface Logger {
  /** Log at trace level */
  trace(message: string, context?: LogContext): void;
  trace(context: LogContext, message: string): void;

  /** Log at debug level */
  debug(message: string, context?: LogContext): void;
  debug(context: LogContext, message: string): void;

  /** Log at info level */
  info(message: string, context?: LogContext): void;
  info(context: LogContext, message: string): void;

  /** Log at warn level */
  warn(message: string, context?: LogContext): void;
  warn(context: LogContext, message: string): void;

  /** Log at error level */
  error(message: string, context?: LogContext): void;
  error(context: LogContext, message: string): void;
  error(error: Error, message?: string): void;

  /** Log at fatal level */
  fatal(message: string, context?: LogContext): void;
  fatal(context: LogContext, message: string): void;
  fatal(error: Error, message?: string): void;

  /** Create a child logger with additional context */
  child(bindings: LogContext): Logger;

  /** Check if a log level is enabled */
  isLevelEnabled(level: LogLevel): boolean;

  /** Flush any buffered logs */
  flush(): void;
}

/**
 * Internal Pino logger type
 */
export type PinoLoggerInstance = PinoLogger;

/**
 * Default fields that should always be redacted
 */
export const DEFAULT_REDACT_PATHS = [
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "apiKey",
  "secret",
  "creditCard",
  "ssn",
  "req.headers.authorization",
  "req.headers.cookie",
  "res.headers.set-cookie",
] as const;
