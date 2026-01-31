/**
 * @buildbase/email - Core Types
 * All TypeScript interfaces and types for the email package
 *
 * Re-exports CRUD types from @buildbase/database and defines email-specific types
 */

// Re-export CRUD types from database package
export type {
  CreateEmailProviderInput as CreateProviderInput,
  UpdateEmailProviderInput as UpdateProviderInput,
  ProviderType,
} from "@buildbase/database";

export { PROVIDER_REQUIRED_FIELDS as PROVIDER_CONFIG_SCHEMA } from "@buildbase/database";

// =============================================================================
// Provider Config Types (email-specific)
// =============================================================================

/**
 * SMTP configuration stored in database (encrypted)
 */
export interface SmtpConfig extends Record<string, unknown> {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

/**
 * Resend API configuration
 */
export interface ResendConfig extends Record<string, unknown> {
  apiKey: string;
}

/**
 * Mailgun API configuration
 */
export interface MailgunConfig extends Record<string, unknown> {
  apiKey: string;
  domain: string;
  region?: "us" | "eu";
}

/**
 * SendGrid API configuration
 */
export interface SendGridConfig extends Record<string, unknown> {
  apiKey: string;
}

/**
 * AWS SES configuration
 */
export interface SesConfig extends Record<string, unknown> {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Console provider (no config needed)
 */
export interface ConsoleConfig extends Record<string, unknown> {
  // Empty - no config needed for console provider
}

/**
 * Union of all provider configs
 */
export type ProviderConfigMap = {
  CONSOLE: ConsoleConfig;
  SMTP: SmtpConfig;
  RESEND: ResendConfig;
  MAILGUN: MailgunConfig;
  SENDGRID: SendGridConfig;
  SES: SesConfig;
};

// =============================================================================
// Email Types
// =============================================================================

/**
 * Email address with optional display name
 */
export interface EmailAddress {
  email: string;
  name?: string;
}

/**
 * Email attachment
 */
export interface Attachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

/**
 * Options for sending an email
 */
export interface SendEmailOptions {
  /** Recipient email(s) */
  to: string | string[];
  /** Email subject */
  subject: string;
  /** HTML content */
  html: string;
  /** Plain text content (auto-generated from HTML if not provided) */
  text?: string;
  /** Override provider's default from address */
  from?: EmailAddress;
  /** Reply-to address */
  replyTo?: string;
  /** CC recipients */
  cc?: string[];
  /** BCC recipients */
  bcc?: string[];
  /** File attachments */
  attachments?: Attachment[];
  /** Custom email headers */
  headers?: Record<string, string>;
  /** Tags for categorization */
  tags?: string[];
  /** Custom metadata */
  metadata?: Record<string, unknown>;

  // Tracking (enabled by default)
  /** Custom tracking ID (auto-generated if not provided) */
  trackingId?: string;
  /** Set to true to disable tracking for this email */
  disableTracking?: boolean;

  // Provider selection
  /** Use specific provider by ID (default: use default provider) */
  providerId?: string;
}

/**
 * Result of sending an email
 */
export interface SendResult {
  /** Whether the send was successful */
  success: boolean;
  /** Provider's message ID */
  messageId: string;
  /** Name of the provider used */
  provider: string;
  /** ID of the provider used */
  providerId: string;
  /** Timestamp of the send */
  timestamp: Date;
  /** Tracking ID for this email (always returned) */
  trackingId: string;
  /** Error messages if failed */
  errors?: string[];
}

/**
 * Result of bulk email send
 */
export interface BulkSendResult {
  total: number;
  successful: SendResult[];
  failed: Array<{ email: string; error: string }>;
}

// =============================================================================
// Provider Instance Interface
// =============================================================================

import type { ProviderType } from "@buildbase/database";

/**
 * Interface that all provider implementations must satisfy
 */
export interface EmailProviderInstance {
  /** Provider database ID */
  readonly id: string;
  /** Provider display name */
  readonly name: string;
  /** Provider type */
  readonly type: ProviderType;
  /** Default from address */
  readonly fromEmail: string;
  /** Default from name */
  readonly fromName: string;

  /**
   * Send a single email
   */
  send(options: SendEmailOptions): Promise<SendResult>;

  /**
   * Send multiple emails (optional - falls back to sequential sends)
   */
  sendBulk?(emails: SendEmailOptions[]): Promise<BulkSendResult>;

  /**
   * Test the provider connection/credentials
   */
  testConnection(): Promise<{ success: boolean; error?: string }>;
}
