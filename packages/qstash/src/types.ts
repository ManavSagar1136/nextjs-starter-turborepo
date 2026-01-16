/* eslint-disable @typescript-eslint/no-explicit-any */

// Logger interface for dependency injection (same pattern as cache package)
export interface Logger {
  info: (data: { tag?: string; msg: string; data?: any; error?: any }) => void;
  warn: (data: { tag?: string; msg: string; data?: any; error?: any }) => void;
  error: (data: { tag?: string; msg: string; data?: any; error?: any }) => void;
}

// Default no-op logger
export const noOpLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

// QStash configuration
export interface QStashConfig {
  token: string;
  url?: string;
  currentSigningKey: string;
  nextSigningKey?: string;
}

// Publish options
export interface PublishOptions {
  url: string;
  body?: any;
  headers?: Record<string, string>;
  delay?: string | number;
  retries?: number;
  deduplicationId?: string;
  contentBasedDeduplication?: boolean;
  topic?: string;
  callback?: string;
  failureCallback?: string;
}

// Schedule options
export interface ScheduleOptions {
  destination: string;
  cron?: string;
  delay?: string | number;
  body?: any;
  headers?: Record<string, string>;
}

// Publish result
export interface PublishResult {
  messageId: string;
  url: string;
}

// Schedule result
export interface ScheduleResult {
  scheduleId: string;
  destination: string;
  cron?: string;
}

// Verify options
export interface VerifyOptions {
  signature: string;
  body: string;
  url?: string;
  clockTolerance?: number;
}

// Verify result
export interface VerifyResult {
  valid: boolean;
  error?: string;
}

// Queue options
export interface QueueOptions {
  queueName: string;
  url: string;
  body?: any;
  headers?: Record<string, string>;
  delay?: string | number;
}

// Topic publish options
export interface TopicPublishOptions {
  topic: string;
  url: string;
  body?: any;
  headers?: Record<string, string>;
  delay?: string | number;
}

// QStash webhook middleware options
export interface QStashWebhookOptions {
  /**
   * QStash receiver instance (optional, uses default if not provided)
   */
  receiver?: import("./receiver").QStashReceiver;

  /**
   * Enable idempotency to prevent duplicate execution
   * @default true
   */
  enableIdempotency?: boolean;

  /**
   * Custom function to generate idempotency key
   * If not provided, uses messageId or deduplicationId from headers
   */
  idempotencyKey?: (req: import("next/server").NextRequest) => Promise<string> | string;

  /**
   * TTL for idempotency cache in seconds
   * @default 3600 (1 hour)
   */
  idempotencyTTL?: number;

  /**
   * Cache service instance (optional, uses defaultCacheService if not provided)
   */
  cacheService?: import("@buildbase/cache/service").CacheService;

  /**
   * Custom error message when signature verification fails
   */
  errorMessage?: string;

  /**
   * Whether to allow requests without signature (for development)
   * @default false
   */
  allowWithoutAuth?: boolean;
}
