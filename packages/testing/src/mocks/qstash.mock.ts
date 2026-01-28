/**
 * QStash Mock
 *
 * Provides mock for @buildbase/qstash message queue operations.
 *
 * @example
 * ```ts
 * import {
 *   qstashMock,
 *   getPublishedMessages,
 *   clearPublishedMessages,
 *   resetQstashMock,
 * } from '@buildbase/testing/mocks/qstash';
 *
 * vi.mock('@buildbase/qstash', () => ({
 *   defaultQStashClient: qstashMock,
 * }));
 *
 * describe('Message publishing', () => {
 *   beforeEach(() => {
 *     resetQstashMock();
 *   });
 *
 *   it('publishes message', async () => {
 *     await qstashMock.publishJSON({
 *       url: 'https://api.example.com/webhook',
 *       body: { event: 'user.created' },
 *     });
 *
 *     const messages = getPublishedMessages();
 *     expect(messages).toHaveLength(1);
 *     expect(messages[0].body).toEqual({ event: 'user.created' });
 *   });
 * });
 * ```
 */

import { vi } from "vitest";

// ============================================================================
// Types
// ============================================================================

export interface PublishOptions {
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  delay?: string | number;
  retries?: number;
  callback?: string;
  failureCallback?: string;
}

export interface ScheduleOptions {
  destination: string;
  cron: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface PublishedMessage {
  messageId: string;
  url: string;
  body: unknown;
  headers: Record<string, string>;
  delay?: string | number;
  publishedAt: Date;
}

export interface ScheduledJob {
  scheduleId: string;
  destination: string;
  cron: string;
  body: unknown;
  createdAt: Date;
}

// ============================================================================
// Mock Storage
// ============================================================================

/**
 * Storage for published messages (for assertions)
 */
const publishedMessages: PublishedMessage[] = [];

/**
 * Storage for scheduled jobs (for assertions)
 */
const scheduledJobs: ScheduledJob[] = [];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all published messages
 */
export function getPublishedMessages(): PublishedMessage[] {
  return [...publishedMessages];
}

/**
 * Clear published messages
 */
export function clearPublishedMessages(): void {
  publishedMessages.length = 0;
}

/**
 * Get all scheduled jobs
 */
export function getScheduledJobs(): ScheduledJob[] {
  return [...scheduledJobs];
}

/**
 * Clear scheduled jobs
 */
export function clearScheduledJobs(): void {
  scheduledJobs.length = 0;
}

/**
 * Find messages by URL pattern
 */
export function findMessagesByUrl(urlPattern: string | RegExp): PublishedMessage[] {
  return publishedMessages.filter(msg => {
    if (typeof urlPattern === "string") {
      return msg.url.includes(urlPattern);
    }
    return urlPattern.test(msg.url);
  });
}

/**
 * Find messages by body content
 */
export function findMessagesByBody(predicate: (body: unknown) => boolean): PublishedMessage[] {
  return publishedMessages.filter(msg => predicate(msg.body));
}

// ============================================================================
// QStash Mock
// ============================================================================

/**
 * Generate a mock message ID
 */
function generateMessageId(): string {
  return `msg_${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Generate a mock schedule ID
 */
function generateScheduleId(): string {
  return `sched_${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Mock QStash client
 */
export const qstashMock = {
  /**
   * Publish a JSON message
   */
  publishJSON: vi.fn(async (options: PublishOptions): Promise<{ messageId: string }> => {
    const messageId = generateMessageId();

    publishedMessages.push({
      messageId,
      url: options.url,
      body: options.body,
      headers: options.headers || {},
      delay: options.delay,
      publishedAt: new Date(),
    });

    return { messageId };
  }),

  /**
   * Publish a raw message
   */
  publish: vi.fn(async (options: PublishOptions): Promise<{ messageId: string }> => {
    const messageId = generateMessageId();

    publishedMessages.push({
      messageId,
      url: options.url,
      body: options.body,
      headers: options.headers || {},
      delay: options.delay,
      publishedAt: new Date(),
    });

    return { messageId };
  }),

  /**
   * Schedule a recurring job
   */
  schedule: vi.fn(async (options: ScheduleOptions): Promise<{ scheduleId: string }> => {
    const scheduleId = generateScheduleId();

    scheduledJobs.push({
      scheduleId,
      destination: options.destination,
      cron: options.cron,
      body: options.body,
      createdAt: new Date(),
    });

    return { scheduleId };
  }),

  /**
   * Delete a scheduled job
   */
  deleteSchedule: vi.fn(async (scheduleId: string): Promise<void> => {
    const index = scheduledJobs.findIndex(job => job.scheduleId === scheduleId);
    if (index !== -1) {
      scheduledJobs.splice(index, 1);
    }
  }),

  /**
   * Get schedule details
   */
  getSchedule: vi.fn(async (scheduleId: string): Promise<ScheduledJob | null> => {
    return scheduledJobs.find(job => job.scheduleId === scheduleId) || null;
  }),

  /**
   * List all schedules
   */
  listSchedules: vi.fn(async (): Promise<ScheduledJob[]> => {
    return [...scheduledJobs];
  }),

  /**
   * Verify webhook signature
   */
  verify: vi.fn(async (): Promise<boolean> => {
    return true;
  }),
};

// ============================================================================
// Webhook Middleware Mock
// ============================================================================

/**
 * Mock withQStashWebhook middleware
 *
 * @example
 * ```ts
 * const handler = withQStashWebhookMock(async (req) => {
 *   const body = await req.json();
 *   await processWebhook(body);
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withQStashWebhookMock<T>(handler: (request: Request) => Promise<T>): (request: Request) => Promise<T> {
  return async (request: Request) => {
    // In mock, we skip signature verification
    return handler(request);
  };
}

// ============================================================================
// Reset Function
// ============================================================================

/**
 * Reset all QStash mock state
 */
export function resetQstashMock(): void {
  // Clear storage
  clearPublishedMessages();
  clearScheduledJobs();

  // Reset mock functions
  qstashMock.publishJSON.mockClear();
  qstashMock.publish.mockClear();
  qstashMock.schedule.mockClear();
  qstashMock.deleteSchedule.mockClear();
  qstashMock.getSchedule.mockClear();
  qstashMock.listSchedules.mockClear();
  qstashMock.verify.mockClear();
}

// Default export
export default {
  qstashMock,
  getPublishedMessages,
  clearPublishedMessages,
  getScheduledJobs,
  clearScheduledJobs,
  findMessagesByUrl,
  findMessagesByBody,
  withQStashWebhookMock,
  resetQstashMock,
};
