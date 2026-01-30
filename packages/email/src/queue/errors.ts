/**
 * @buildbase/email - Queue Errors
 */

/**
 * Error thrown when queue is not configured
 */
export class QueueNotConfiguredError extends Error {
  constructor() {
    super("Email queue is not configured. Set QSTASH_TOKEN and APP_URL environment variables.");
    this.name = "QueueNotConfiguredError";
  }
}

/**
 * Error thrown when queue operation fails
 */
export class QueueOperationError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "QueueOperationError";
  }
}
