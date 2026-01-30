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
