/**
 * @buildbase/email - Queue Module
 * Email queuing with QStash integration
 */

// Export queue service
export { EmailQueue, EmailQueueService, getEmailQueue } from "./queue.service.js";

// Export signature verification and processing
export { verifyQStashSignature, createQStashMiddleware, processQueuedEmail } from "./verify.js";

// Export errors
export { QueueNotConfiguredError, QueueOperationError } from "./errors.js";

// Export types
export type {
  QueueOptions,
  QueueStatus,
  QueuedEmail,
  QueueResult,
  BulkQueueResult,
  QueuePayload,
  ProcessingResult,
  SendWithQueueOptions,
} from "./types.js";
