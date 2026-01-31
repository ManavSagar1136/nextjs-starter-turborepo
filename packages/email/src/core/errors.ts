/**
 * @buildbase/email - Custom Error Classes
 * Typed errors for better error handling
 */

/**
 * Base error class for all email-related errors
 */
export class EmailError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "EmailError";
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Error thrown when a provider operation fails
 */
export class ProviderError extends EmailError {
  constructor(
    message: string,
    public readonly provider: string,
    cause?: Error
  ) {
    super(message, "PROVIDER_ERROR", cause);
    this.name = "ProviderError";
  }
}

/**
 * Error thrown when a provider is not found
 */
export class ProviderNotFoundError extends EmailError {
  constructor(public readonly providerId: string) {
    super(`Email provider not found: ${providerId}`, "PROVIDER_NOT_FOUND");
    this.name = "ProviderNotFoundError";
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends EmailError {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value?: unknown
  ) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

/**
 * Error thrown when configuration is invalid or missing
 */
export class ConfigurationError extends EmailError {
  constructor(
    message: string,
    public readonly key?: string
  ) {
    super(message, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
  }
}

/**
 * Error thrown when encryption/decryption fails
 */
export class EncryptionError extends EmailError {
  constructor(message: string, cause?: Error) {
    super(message, "ENCRYPTION_ERROR", cause);
    this.name = "EncryptionError";
  }
}

/**
 * Error thrown when no default provider is configured
 */
export class NoDefaultProviderError extends EmailError {
  constructor() {
    super("No default email provider configured. Please add a provider in the admin panel.", "NO_DEFAULT_PROVIDER");
    this.name = "NoDefaultProviderError";
  }
}

/**
 * Error thrown when template operations fail
 */
export class TemplateError extends EmailError {
  constructor(
    message: string,
    public readonly templateId?: string
  ) {
    super(message, "TEMPLATE_ERROR");
    this.name = "TemplateError";
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends EmailError {
  constructor(
    public readonly provider: string,
    public readonly retryAfterMs?: number
  ) {
    super(
      `Rate limit exceeded for provider ${provider}${retryAfterMs ? `. Retry after ${Math.ceil(retryAfterMs / 1000)}s` : ""}`,
      "RATE_LIMIT_EXCEEDED"
    );
    this.name = "RateLimitError";
  }
}

/**
 * Error thrown when email service is not initialized
 */
export class NotInitializedError extends EmailError {
  constructor() {
    super("EmailService not initialized. Call EmailService.initialize(prisma) first.", "NOT_INITIALIZED");
    this.name = "NotInitializedError";
  }
}

/**
 * Error codes for programmatic handling
 */
export const ErrorCodes = {
  PROVIDER_ERROR: "PROVIDER_ERROR",
  PROVIDER_NOT_FOUND: "PROVIDER_NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
  ENCRYPTION_ERROR: "ENCRYPTION_ERROR",
  NO_DEFAULT_PROVIDER: "NO_DEFAULT_PROVIDER",
  TEMPLATE_ERROR: "TEMPLATE_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  NOT_INITIALIZED: "NOT_INITIALIZED",
  QUEUE_NOT_CONFIGURED: "QUEUE_NOT_CONFIGURED",
  QUEUE_OPERATION_ERROR: "QUEUE_OPERATION_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
