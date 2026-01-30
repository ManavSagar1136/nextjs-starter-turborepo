# Phase 4: QStash Queue Integration

> **Status:** ⏳ Pending  
> **Duration:** 3-4 days  
> **Branch:** `feature/email-package`  
> **Depends on:** Phase 3

## Objective

Implement email queuing with QStash for delayed sends, scheduled sends, and reliable delivery with retry logic.

---

## User Stories

### US-4.1: QStash Client Setup

**As a** developer  
**I want** QStash client configured  
**So that** I can queue messages for async processing

**Acceptance Criteria:**

- [ ] `@upstash/qstash` package installed
- [ ] Client initialized with env vars
- [ ] Connection verified on startup
- [ ] Graceful fallback if not configured

### US-4.2: Queue Types

**As a** developer  
**I want** well-defined queue types  
**So that** I have type safety for queued emails

**Acceptance Criteria:**

- [ ] `QueuedEmail` interface defined
- [ ] `QueueOptions` interface (delay, schedule, retries)
- [ ] `QueueStatus` enum
- [ ] `QueueResult` type

### US-4.3: Enqueue Single Email

**As a** developer  
**I want** to queue an email for async sending  
**So that** I don't block the main request

**Acceptance Criteria:**

- [ ] `EmailQueue.enqueue(email, options?)` method
- [ ] Returns queue message ID
- [ ] Stores email payload in queue
- [ ] Supports immediate or delayed processing

### US-4.4: Delayed Send

**As a** developer  
**I want** to send emails after a delay  
**So that** I can implement drip campaigns, reminders, etc.

**Acceptance Criteria:**

- [ ] `EmailQueue.delay(email, delayMs)` method
- [ ] `EmailQueue.delay(email, '5m')` string format
- [ ] Supports seconds, minutes, hours, days
- [ ] Email sent after delay expires

### US-4.5: Scheduled Send

**As a** developer  
**I want** to schedule emails for specific times  
**So that** I can send at optimal times

**Acceptance Criteria:**

- [ ] `EmailQueue.schedule(email, date)` method
- [ ] Accepts Date object or ISO string
- [ ] Email sent at specified time
- [ ] Handles timezone correctly

### US-4.6: Bulk Queue

**As a** developer  
**I want** to queue many emails efficiently  
**So that** I can send newsletters, announcements

**Acceptance Criteria:**

- [ ] `EmailQueue.enqueueBulk(emails, options)` method
- [ ] Batches requests (100 per batch)
- [ ] Optional delay between batches
- [ ] Returns array of message IDs
- [ ] Handles partial failures

### US-4.7: Cancel Queued Email

**As a** developer  
**I want** to cancel a scheduled email  
**So that** I can stop emails before they send

**Acceptance Criteria:**

- [ ] `EmailQueue.cancel(messageId)` method
- [ ] Removes message from queue
- [ ] Returns success/failure status
- [ ] Throws if message already sent

### US-4.8: Retry Logic

**As a** developer  
**I want** automatic retries for failed sends  
**So that** transient failures don't lose emails

**Acceptance Criteria:**

- [ ] Configurable max retries (default: 3)
- [ ] Exponential backoff between retries
- [ ] QStash handles retry automatically
- [ ] Dead letter queue for final failures

### US-4.9: Processing Endpoint

**As a** developer  
**I want** an endpoint to process queued emails  
**So that** QStash can trigger email sending

**Acceptance Criteria:**

- [ ] `POST /api/email/process` endpoint
- [ ] Verifies QStash signature
- [ ] Extracts email from payload
- [ ] Sends via EmailService
- [ ] Returns appropriate status codes

### US-4.10: Queue Status

**As a** developer  
**I want** to check queue status  
**So that** I can monitor queued emails

**Acceptance Criteria:**

- [ ] `EmailQueue.getStatus(messageId)` method
- [ ] Returns current status (pending, processing, sent, failed)
- [ ] Includes attempt count
- [ ] Includes scheduled/processed times

### US-4.11: Direct vs Queued Toggle

**As a** developer  
**I want** to easily switch between direct and queued sending  
**So that** I can choose based on use case

**Acceptance Criteria:**

- [ ] `sendEmail()` sends directly (existing)
- [ ] `sendEmail({ queue: true })` queues instead
- [ ] `sendEmail({ delay: '5m' })` queues with delay
- [ ] Configuration for default behavior

---

## Technical Specification

### Directory Structure

```
packages/email/src/queue/
├── index.ts           # Exports
├── types.ts           # Queue types
├── queue.service.ts   # Main queue service
├── scheduler.ts       # Scheduling utilities
├── retry.ts           # Retry configuration
└── signature.ts       # QStash signature verification
```

### Queue Types

```typescript
// src/queue/types.ts

export interface QueueOptions {
  /** Delay in ms or string ('5m', '1h', '2d') */
  delay?: number | string;

  /** Specific time to send */
  scheduledAt?: Date | string;

  /** Max retry attempts (default: 3) */
  maxRetries?: number;

  /** Base retry delay in ms (default: 1000) */
  retryDelay?: number;

  /** Callback URL for completion notification */
  callback?: string;

  /** Deduplication ID to prevent duplicates */
  deduplicationId?: string;

  /** Content-based deduplication */
  contentBasedDeduplication?: boolean;
}

export interface QueuedEmail {
  id: string;
  email: SendEmailOptions;
  options: QueueOptions;
  status: QueueStatus;
  attempts: number;
  createdAt: Date;
  scheduledFor?: Date;
  processedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export type QueueStatus =
  | "pending"
  | "scheduled"
  | "processing"
  | "sent"
  | "failed"
  | "cancelled";

export interface QueueResult {
  messageId: string;
  status: "queued" | "scheduled";
  scheduledFor?: Date;
}

export interface BulkQueueResult {
  total: number;
  queued: number;
  failed: number;
  messageIds: string[];
  errors: Array<{ index: number; error: string }>;
}
```

### Queue Service

```typescript
// src/queue/queue.service.ts
import { Client } from "@upstash/qstash";

export class EmailQueueService {
  private client: Client | null = null;
  private callbackUrl: string;
  private isConfigured = false;

  constructor() {
    if (process.env.QSTASH_TOKEN) {
      this.client = new Client({ token: process.env.QSTASH_TOKEN });
      this.callbackUrl = `${process.env.APP_URL}/api/email/process`;
      this.isConfigured = true;
    }
  }

  /**
   * Queue a single email for async sending
   */
  async enqueue(
    email: SendEmailOptions,
    options?: QueueOptions
  ): Promise<QueueResult> {
    this.ensureConfigured();

    const delay = this.parseDelay(options?.delay);
    const scheduledFor = options?.scheduledAt
      ? new Date(options.scheduledAt)
      : delay
        ? new Date(Date.now() + delay)
        : undefined;

    const response = await this.client!.publishJSON({
      url: this.callbackUrl,
      body: { email, options },
      delay: delay ? Math.floor(delay / 1000) : undefined, // QStash uses seconds
      notBefore: scheduledFor?.getTime(),
      retries: options?.maxRetries ?? 3,
      deduplicationId: options?.deduplicationId,
      contentBasedDeduplication: options?.contentBasedDeduplication,
    });

    return {
      messageId: response.messageId,
      status: scheduledFor ? "scheduled" : "queued",
      scheduledFor,
    };
  }

  /**
   * Queue email with delay
   */
  async delay(
    email: SendEmailOptions,
    delay: number | string
  ): Promise<QueueResult> {
    return this.enqueue(email, { delay });
  }

  /**
   * Schedule email for specific time
   */
  async schedule(
    email: SendEmailOptions,
    scheduledAt: Date | string
  ): Promise<QueueResult> {
    return this.enqueue(email, { scheduledAt });
  }

  /**
   * Queue multiple emails (batched)
   */
  async enqueueBulk(
    emails: SendEmailOptions[],
    options?: QueueOptions
  ): Promise<BulkQueueResult> {
    this.ensureConfigured();

    const batchSize = 100;
    const messageIds: string[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map((email, batchIndex) =>
          this.enqueue(email, {
            ...options,
            // Stagger sends to avoid rate limits
            delay: options?.delay
              ? this.addDelay(options.delay, batchIndex * 100)
              : batchIndex * 100,
          })
        )
      );

      results.forEach((result, batchIndex) => {
        const globalIndex = i + batchIndex;
        if (result.status === "fulfilled") {
          messageIds.push(result.value.messageId);
        } else {
          errors.push({
            index: globalIndex,
            error: result.reason?.message || "Unknown error",
          });
        }
      });
    }

    return {
      total: emails.length,
      queued: messageIds.length,
      failed: errors.length,
      messageIds,
      errors,
    };
  }

  /**
   * Cancel a scheduled email
   */
  async cancel(messageId: string): Promise<boolean> {
    this.ensureConfigured();

    try {
      await this.client!.messages.delete(messageId);
      return true;
    } catch (error) {
      // Message may already be processed
      return false;
    }
  }

  /**
   * Get queue status for a message
   */
  async getStatus(messageId: string): Promise<QueuedEmail | null> {
    this.ensureConfigured();

    try {
      const message = await this.client!.messages.get(messageId);
      return {
        id: messageId,
        email: message.body as SendEmailOptions,
        options: {},
        status: this.mapQStashState(message.state),
        attempts: message.retried || 0,
        createdAt: new Date(message.createdAt),
        scheduledFor: message.notBefore
          ? new Date(message.notBefore)
          : undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if queue is configured
   */
  get configured(): boolean {
    return this.isConfigured;
  }

  // --- Private helpers ---

  private ensureConfigured(): void {
    if (!this.isConfigured) {
      throw new QueueNotConfiguredError();
    }
  }

  private parseDelay(delay?: number | string): number | undefined {
    if (!delay) return undefined;
    if (typeof delay === "number") return delay;

    const match = delay.match(/^(\d+)(ms|s|m|h|d)$/);
    if (!match) return parseInt(delay, 10);

    const [, value, unit] = match;
    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return parseInt(value) * multipliers[unit];
  }

  private addDelay(base: number | string, additional: number): number {
    const baseMs = this.parseDelay(base) || 0;
    return baseMs + additional;
  }

  private mapQStashState(state: string): QueueStatus {
    switch (state) {
      case "PENDING":
        return "pending";
      case "ACTIVE":
        return "processing";
      case "DELIVERED":
        return "sent";
      case "ERROR":
      case "FAILED":
        return "failed";
      default:
        return "pending";
    }
  }
}

// Singleton export
export const EmailQueue = new EmailQueueService();
```

### Processing Endpoint

```typescript
// API Route: POST /api/email/process

import { verifySignature } from "@upstash/qstash/nextjs";
import { EmailService } from "@buildbase/email";

async function handler(req: Request) {
  const { email, options } = await req.json();

  try {
    // Send the email
    const result = await EmailService.send(email);

    if (result.success) {
      return Response.json({
        success: true,
        messageId: result.messageId,
        provider: result.provider,
      });
    } else {
      // Return 500 to trigger QStash retry
      return new Response(
        JSON.stringify({ error: result.errors?.join(", ") }),
        { status: 500 }
      );
    }
  } catch (error) {
    // Return 500 to trigger QStash retry
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

// Wrap with signature verification
export const POST = verifySignature(handler);

export const config = {
  api: {
    bodyParser: false, // Required for signature verification
  },
};
```

### Signature Verification

```typescript
// src/queue/signature.ts
import { Receiver } from "@upstash/qstash";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function verifyQStashSignature(
  signature: string | null,
  body: string,
  url: string
): Promise<boolean> {
  if (!signature) return false;

  try {
    await receiver.verify({
      signature,
      body,
      url,
    });
    return true;
  } catch {
    return false;
  }
}
```

### EmailService Integration

```typescript
// src/service/email.service.ts (additions)

interface SendOptions extends SendEmailOptions {
  /** Queue for async sending */
  queue?: boolean;
  /** Delay before sending */
  delay?: number | string;
  /** Schedule for specific time */
  scheduledAt?: Date | string;
}

export class EmailService {
  static async send(options: SendOptions): Promise<SendResult | QueueResult> {
    // Check if should queue
    if (options.queue || options.delay || options.scheduledAt) {
      const { queue, delay, scheduledAt, ...emailOptions } = options;
      return EmailQueue.enqueue(emailOptions, { delay, scheduledAt });
    }

    // Direct send
    const provider = this.factory.getProvider();
    return provider.send(options);
  }
}
```

---

## Environment Variables

```bash
# QStash Configuration
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=xxxxx
QSTASH_CURRENT_SIGNING_KEY=sig_xxxxx
QSTASH_NEXT_SIGNING_KEY=sig_xxxxx

# App URL (for callback)
APP_URL=https://yourapp.com
```

---

## Dependencies

```json
{
  "dependencies": {
    "@upstash/qstash": "^2.0.0"
  }
}
```

---

## Usage Examples

```typescript
import { EmailQueue, sendEmail } from "@buildbase/email";

// Immediate queue (async)
await EmailQueue.enqueue({
  to: "user@example.com",
  subject: "Welcome!",
  html: "<h1>Hello</h1>",
});

// Delayed send
await EmailQueue.delay(email, "5m"); // 5 minutes
await EmailQueue.delay(email, "2h"); // 2 hours
await EmailQueue.delay(email, 30000); // 30 seconds (ms)

// Scheduled send
await EmailQueue.schedule(email, new Date("2024-02-01T09:00:00Z"));
await EmailQueue.schedule(email, "2024-02-01T09:00:00Z");

// Bulk queue with staggering
await EmailQueue.enqueueBulk(emails, {
  delay: "1s", // 1 second between each
  maxRetries: 5,
});

// Via sendEmail with options
await sendEmail({
  to: "user@example.com",
  subject: "Reminder",
  html: "<p>Don't forget!</p>",
  delay: "1h", // Queued automatically
});

// Cancel scheduled email
await EmailQueue.cancel(messageId);
```

---

## Definition of Done

- [ ] QStash client configured
- [ ] All queue operations working
- [ ] Processing endpoint secure
- [ ] Retry logic working
- [ ] Bulk queue working
- [ ] Cancel working
- [ ] Integration tests passing
- [ ] Documentation updated

---

## Estimated Effort

| Task                     | Hours               |
| ------------------------ | ------------------- |
| QStash setup             | 2h                  |
| Queue types              | 2h                  |
| Queue service            | 6h                  |
| Processing endpoint      | 3h                  |
| Signature verification   | 2h                  |
| Retry logic              | 2h                  |
| Bulk queue               | 3h                  |
| EmailService integration | 2h                  |
| Integration tests        | 4h                  |
| **Total**                | **~26h (3-4 days)** |
