/**
 * @buildbase/email - Queue Types
 */

import type { SendEmailOptions, SendResult } from "../core/types.js";

/**
 * Options for queuing an email
 */
export interface QueueOptions {
  /** Delay in ms or string ('5m', '1h', '2d') */
  delay?: number | string;

  /** Specific time to send */
  scheduledAt?: Date | string;

  /** Max retry attempts (default: 3) */
  maxRetries?: number;

  /** Callback URL for completion notification */
  callback?: string;

  /** Failure callback URL */
  failureCallback?: string;

  /** Deduplication ID to prevent duplicates */
  deduplicationId?: string;

  /** Content-based deduplication */
  contentBasedDeduplication?: boolean;
}

/**
 * Status of a queued email
 */
export type QueueStatus = "pending" | "scheduled" | "processing" | "sent" | "failed" | "cancelled";

/**
 * Queued email representation
 */
export interface QueuedEmail {
  /** Message ID from QStash */
  id: string;
  /** Original email options */
  email: SendEmailOptions;
  /** Queue options used */
  options: QueueOptions;
  /** Current status */
  status: QueueStatus;
  /** Number of attempts */
  attempts: number;
  /** When the email was queued */
  createdAt: Date;
  /** When the email is scheduled for */
  scheduledFor?: Date;
  /** When processing started */
  processedAt?: Date;
  /** When completed (sent or failed) */
  completedAt?: Date;
  /** Error message if failed */
  error?: string;
}

/**
 * Result of queuing an email
 */
export interface QueueResult {
  /** Message ID from QStash */
  messageId: string;
  /** Status after queuing */
  status: "queued" | "scheduled";
  /** When the email will be sent */
  scheduledFor?: Date;
}

/**
 * Result of bulk queue operation
 */
export interface BulkQueueResult {
  /** Total emails attempted */
  total: number;
  /** Successfully queued count */
  queued: number;
  /** Failed to queue count */
  failed: number;
  /** Message IDs of queued emails */
  messageIds: string[];
  /** Errors for failed emails */
  errors: Array<{ index: number; error: string }>;
}

/**
 * Payload sent to the processing endpoint
 */
export interface QueuePayload {
  /** Email to send */
  email: SendEmailOptions;
  /** Original queue options */
  options?: QueueOptions;
  /** Timestamp when queued */
  queuedAt: string;
}

/**
 * Response from the processing endpoint
 */
export interface ProcessingResult {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
}

/**
 * Extended send options with queue support
 */
export interface SendWithQueueOptions extends SendEmailOptions {
  /** Queue for async sending */
  queue?: boolean;
  /** Delay before sending */
  delay?: number | string;
  /** Schedule for specific time */
  scheduledAt?: Date | string;
  /** Max retries if queued */
  maxRetries?: number;
}
