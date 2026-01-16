# @buildbase/qstash

A comprehensive, framework-agnostic QStash package for serverless messaging, scheduling, and webhook handling. Built on Upstash QStash, designed for Vercel and edge-compatible environments.

## Features

- ✅ **Message Publishing**: Publish messages immediately or with delays
- ✅ **Scheduling**: Cron-based and one-time scheduled tasks
- ✅ **Queue Management**: FIFO queues and topic-based fan-out
- ✅ **Signature Verification**: Secure webhook verification with signing keys
- ✅ **Retry & DLQ**: Built-in retry logic and dead-letter queue support
- ✅ **Edge-Compatible**: Works in Vercel Edge Runtime and Node.js
- ✅ **Framework Agnostic**: Core functionality doesn't depend on any framework
- ✅ **TypeScript Support**: Full TypeScript support with proper typing
- ✅ **Dependency Injection**: Logger and config can be injected

## Installation

```bash
npm install @buildbase/qstash
# or
yarn add @buildbase/qstash
```

### Available Import Paths

- `@buildbase/qstash/factory` - Factory functions and default instances
- `@buildbase/qstash/client` - QStashClient class for publishing/scheduling
- `@buildbase/qstash/receiver` - QStashReceiver class for signature verification
- `@buildbase/qstash/middleware` - Webhook middleware with idempotency
- `@buildbase/qstash/config` - Configuration helpers
- `@buildbase/qstash/types` - TypeScript types

## How It Works

### No Cron Jobs Required

**QStash is a fully managed service** - you don't need to set up cron jobs or background workers. QStash handles:

- Message scheduling and delivery
- Automatic retries on failures
- Dead-letter queue management
- Cron-based recurring tasks

### Message Delivery Flow

1. **Publish Message**: Your app publishes a message to QStash with a destination URL
2. **QStash Stores**: QStash stores the message durably
3. **QStash Delivers**: QStash sends an HTTP POST request to your endpoint
4. **Your Endpoint Handles**: Your Next.js API route receives and processes the message
5. **Automatic Retries**: If delivery fails, QStash automatically retries
6. **Callbacks (Optional)**: QStash can notify you of delivery success/failure

### Architecture Diagram

```
Your App                    QStash Service              Your Webhook Endpoint
   │                              │                              │
   │── Publish Message ──────────>│                              │
   │                              │── Store Message              │
   │                              │                              │
   │                              │── HTTP POST ────────────────>│
   │                              │                              │── Process
   │                              │<── 200 OK ───────────────────│
   │                              │                              │
   │                              │── Delivery Complete          │
```

### What You Need to Do

1. **Create Webhook Endpoints**: Set up Next.js API routes to receive messages
2. **Verify Signatures**: Use `QStashReceiver` to verify incoming requests
3. **Publish Messages**: Use `QStashClient` to send messages
4. **Handle Messages**: Process messages in your webhook endpoints

**That's it!** QStash handles all the scheduling, retries, and delivery automatically.

## Environment Variables

### Required (for full functionality)

For Vercel, add these to your environment variables in the Vercel dashboard:

```bash
QSTASH_TOKEN=your_qstash_token_here
QSTASH_CURRENT_SIGNING_KEY=your_current_signing_key_here
```

**Note**: Get these from [Upstash Console](https://console.upstash.com/). The token is required for publishing messages, and the signing key is required for verifying incoming webhooks.

### Optional

```bash
# QStash base URL (defaults to https://qstash.upstash.io)
QSTASH_URL=https://qstash.upstash.io

# Next signing key for zero-downtime key rotation
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key_here
```

## Basic Usage

### Using Default Factory (Recommended for Vercel)

```typescript
import { defaultQStashClient } from "@buildbase/qstash/factory";

// Publish a message immediately
await defaultQStashClient.publishJSON({
  url: "https://your-app.com/api/webhook",
  body: { event: "user.created", userId: "123" },
});

// Publish with delay
await defaultQStashClient.publishJSON({
  url: "https://your-app.com/api/webhook",
  body: { event: "email.send", email: "user@example.com" },
  delay: "5m", // Delay by 5 minutes
});
```

### Using Custom Factory

```typescript
import { createQStashFactory } from "@buildbase/qstash/factory";

const qstash = createQStashFactory({
  qstashToken: process.env.QSTASH_TOKEN,
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
  logger: {
    info: data => console.log(data),
    warn: data => console.warn(data),
    error: data => console.error(data),
  },
});

await qstash.client.publishJSON({
  url: "https://your-app.com/api/webhook",
  body: { event: "task.completed" },
});
```

## Publishing Messages

### Immediate Publishing

```typescript
import { defaultQStashClient } from "@buildbase/qstash/factory";

await defaultQStashClient.publishJSON({
  url: "https://your-app.com/api/webhook",
  body: {
    event: "order.created",
    orderId: "order-123",
    amount: 99.99,
  },
});
```

### Delayed Publishing

```typescript
// Delay by time string
await defaultQStashClient.publishJSON({
  url: "https://your-app.com/api/webhook",
  body: { event: "reminder" },
  delay: "1h", // 1 hour delay
});

// Delay by seconds
await defaultQStashClient.publishJSON({
  url: "https://your-app.com/api/webhook",
  body: { event: "reminder" },
  delay: 3600, // 3600 seconds
});
```

### Publishing with Retries

```typescript
await defaultQStashClient.publishJSON({
  url: "https://your-app.com/api/webhook",
  body: { event: "important.task" },
  retries: 5, // Retry up to 5 times on failure
});
```

### Deduplication

```typescript
// Content-based deduplication
await defaultQStashClient.publishJSON({
  url: "https://your-app.com/api/webhook",
  body: { event: "process" },
  contentBasedDeduplication: true,
});

// Custom deduplication ID
await defaultQStashClient.publishJSON({
  url: "https://your-app.com/api/webhook",
  body: { event: "process" },
  deduplicationId: "unique-id-123",
});
```

## Scheduling

### Cron Scheduling

```typescript
import { defaultQStashClient } from "@buildbase/qstash/factory";

// Schedule a recurring task
await defaultQStashClient.schedule({
  destination: "https://your-app.com/api/cron/daily-report",
  cron: "0 9 * * *", // Every day at 9 AM
  body: { reportType: "daily" },
});
```

### One-Time Scheduled Task

```typescript
// Schedule a one-time task with delay
await defaultQStashClient.schedule({
  destination: "https://your-app.com/api/task",
  delay: "24h", // Run after 24 hours
  body: { task: "cleanup" },
});
```

### Managing Schedules

```typescript
// Get all schedules
const schedules = await defaultQStashClient.getSchedules();

// Delete a schedule
await defaultQStashClient.deleteSchedule("schedule-id-123");
```

## Queue Management

### FIFO Queues

```typescript
import { defaultQStashClient } from "@buildbase/qstash/factory";

// Enqueue to a FIFO queue
await defaultQStashClient.enqueue({
  queueName: "order-processing",
  url: "https://your-app.com/api/process-order",
  body: { orderId: "order-123" },
});
```

### Topic Publishing (Fan-out)

```typescript
// Publish to a topic (multiple subscribers)
await defaultQStashClient.publishToTopic({
  topic: "user-events",
  url: "https://your-app.com/api/webhook",
  body: { event: "user.updated", userId: "123" },
});
```

## Webhook Middleware

### `withQStashWebhook` - Automatic Verification & Idempotency

Middleware to validate QStash webhook signatures and prevent duplicate execution. Includes built-in idempotency using messageId/deduplicationId.

#### Features

- ✅ Validates QStash signature automatically
- ✅ Prevents duplicate execution using cache-based idempotency
- ✅ Uses messageId or deduplicationId from QStash headers
- ✅ Configurable error messages
- ✅ Development mode support
- ✅ Custom idempotency key generation

#### Basic Usage

```typescript
// app/api/webhook/process/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withQStashWebhook } from "@buildbase/qstash/middleware";

const handler = async (req: NextRequest) => {
  const body = await req.json();

  // Process webhook - signature already verified
  await processWebhook(body);

  return NextResponse.json({ success: true });
};

// Protect with QStash webhook middleware (includes idempotency)
export const POST = withQStashWebhook(handler);
```

#### With Custom Options

```typescript
export const POST = withQStashWebhook(handler, {
  errorMessage: "Invalid QStash signature",
  idempotencyTTL: 7200, // 2 hours
  allowWithoutAuth: process.env.NODE_ENV === "development",
});
```

#### Custom Idempotency Key

```typescript
export const POST = withQStashWebhook(handler, {
  // Custom key based on request body
  idempotencyKey: async req => {
    const body = await req.json();
    return `qstash:${body.eventId}:${body.userId}`;
  },
});
```

#### Disable Idempotency

```typescript
export const POST = withQStashWebhook(handler, {
  enableIdempotency: false, // Disable duplicate prevention
});
```

#### How Idempotency Works

1. **Key Generation**: Uses `messageId` or `deduplicationId` from QStash headers
2. **Cache Check**: Checks if request was already processed
3. **Cached Response**: Returns cached response if duplicate
4. **Execute**: If not cached, executes handler
5. **Cache Result**: Stores response in cache for idempotency window (default: 1 hour)

This prevents the same webhook from being processed multiple times if:

- QStash retries the webhook
- Multiple instances receive the same message
- Network issues cause duplicate deliveries

#### Example: Processing User Events

```typescript
// app/api/webhook/user-events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withQStashWebhook } from "@buildbase/qstash/middleware";

const handler = async (req: NextRequest) => {
  const { event, userId, data } = await req.json();

  switch (event) {
    case "user.created":
      await handleUserCreated(userId, data);
      break;
    case "user.updated":
      await handleUserUpdated(userId, data);
      break;
  }

  return NextResponse.json({ success: true, event });
};

// Automatically prevents duplicate processing using QStash messageId
export const POST = withQStashWebhook(handler);
```

#### Example: Order Processing

```typescript
// app/api/webhook/process-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withQStashWebhook } from "@buildbase/qstash/middleware";

const handler = async (req: NextRequest) => {
  const { orderId, action } = await req.json();

  // Process order
  await processOrder(orderId, action);

  return NextResponse.json({ success: true, orderId });
};

// Use orderId for idempotency - same order won't be processed twice
export const POST = withQStashWebhook(handler, {
  idempotencyKey: async req => {
    const body = await req.json();
    return `process-order:${body.orderId}:${body.action}`;
  },
});
```

## Webhook Verification (Manual)

### Verify Incoming Webhooks Manually

If you need manual verification without the middleware:

```typescript
import { defaultQStashReceiver } from "@buildbase/qstash/factory";

// In Next.js API route
export async function POST(request: Request) {
  // Verify the request signature
  const verification = await defaultQStashReceiver.verifyNextRequest(request);

  if (!verification.valid) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Process the webhook
  const body = await request.json();
  // ... handle webhook logic

  return new Response("OK", { status: 200 });
}
```

### Manual Verification

```typescript
import { defaultQStashReceiver } from "@buildbase/qstash/factory";

const verification = defaultQStashReceiver.verify({
  signature: request.headers["upstash-signature"],
  body: requestBody,
  url: requestUrl,
});

if (!verification.valid) {
  throw new Error("Invalid signature");
}
```

## Next.js Integration

### Complete Example: Publishing and Receiving Messages

Here's a complete flow showing how to publish a message and handle it:

#### 1. Publish a Message

```typescript
// app/api/users/route.ts
import { defaultQStashClient } from "@buildbase/qstash/factory";

export async function POST(request: Request) {
  const { userId, email } = await request.json();

  // Create user in database
  const user = await createUser({ userId, email });

  // Publish message to QStash for async processing
  await defaultQStashClient.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/send-welcome-email`,
    body: {
      userId: user.id,
      email: user.email,
    },
  });

  return Response.json({ success: true, user });
}
```

#### 2. Receive and Process the Message

```typescript
// app/api/webhook/send-welcome-email/route.ts
import { defaultQStashReceiver } from "@buildbase/qstash/factory";

export async function POST(request: Request) {
  // Step 1: Verify the signature (IMPORTANT for security)
  const verification = await defaultQStashReceiver.verifyNextRequest(request);

  if (!verification.valid) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Step 2: Parse the message body
  const { userId, email } = await request.json();

  // Step 3: Process the message (send email, etc.)
  try {
    await sendWelcomeEmail({ userId, email });

    // Return 200 to indicate success
    // QStash will mark this message as successfully delivered
    return new Response("OK", { status: 200 });
  } catch (error) {
    // Return non-2xx status to trigger retry
    // QStash will automatically retry based on your retry settings
    return new Response("Error", { status: 500 });
  }
}
```

### API Route Handler (Simple Example)

```typescript
// app/api/webhook/qstash/route.ts
import { defaultQStashReceiver } from "@buildbase/qstash/factory";

export async function POST(request: Request) {
  // Verify signature
  const verification = await defaultQStashReceiver.verifyNextRequest(request);

  if (!verification.valid) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Parse and process webhook
  const body = await request.json();

  // Handle the webhook
  switch (body.event) {
    case "user.created":
      // Process user creation
      break;
    case "order.completed":
      // Process order completion
      break;
  }

  return new Response("OK", { status: 200 });
}
```

### Publishing from API Route

```typescript
// app/api/tasks/route.ts
import { defaultQStashClient } from "@buildbase/qstash/factory";

export async function POST(request: Request) {
  const { task } = await request.json();

  // Publish to QStash
  await defaultQStashClient.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/process`,
    body: { task },
    delay: "5m",
  });

  return new Response("Task scheduled", { status: 200 });
}
```

## Advanced Usage

### Custom Logger

```typescript
import { createQStashFactory } from "@buildbase/qstash/factory";

const qstash = createQStashFactory({
  logger: {
    info: data => console.log("[INFO]", data),
    warn: data => console.warn("[WARN]", data),
    error: data => console.error("[ERROR]", data),
  },
});
```

### Callbacks

```typescript
await defaultQStashClient.publishJSON({
  url: "https://your-app.com/api/webhook",
  body: { event: "process" },
  callback: "https://your-app.com/api/callback/success",
  failureCallback: "https://your-app.com/api/callback/failure",
});
```

## Vercel Best Practices

1. **Tree-shakeable imports**: Always import from specific paths

   ```typescript
   // ✅ Good
   import { defaultQStashClient } from "@buildbase/qstash/factory";

   // ❌ Avoid (no main export)
   // import { defaultQStashClient } from "@buildbase/qstash";
   ```

2. **Environment variables**: Set all required env vars in Vercel dashboard

3. **Webhook verification**: Always verify signatures in production

4. **Error handling**: Handle QStash errors gracefully with retries

5. **Idempotency**: Design webhook handlers to be idempotent (QStash may retry)

## Local Development

For local development, you can use the QStash CLI:

```bash
# Install QStash CLI
npm install -g @upstash/qstash-cli

# Start local QStash server
qstash dev
```

Then set `QSTASH_URL=http://localhost:8080` in your `.env` file.

## Error Handling

### Publishing Errors

```typescript
import { defaultQStashClient } from "@buildbase/qstash/factory";

try {
  await defaultQStashClient.publishJSON({
    url: "https://your-app.com/api/webhook",
    body: { event: "test" },
  });
} catch (error) {
  console.error("Failed to publish message:", error);
  // Handle error (retry, log, etc.)
}
```

### Webhook Processing Errors

When your webhook endpoint returns a non-2xx status, QStash automatically retries:

```typescript
// app/api/webhook/process/route.ts
import { defaultQStashReceiver } from "@buildbase/qstash/factory";

export async function POST(request: Request) {
  const verification = await defaultQStashReceiver.verifyNextRequest(request);
  if (!verification.valid) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const data = await request.json();

    // Process the message
    await processMessage(data);

    // Return 200 = success, QStash won't retry
    return new Response("OK", { status: 200 });
  } catch (error) {
    // Return 500 = failure, QStash will retry automatically
    console.error("Processing failed:", error);
    return new Response("Error", { status: 500 });
  }
}
```

### Retry Behavior

- QStash automatically retries failed deliveries
- Retry intervals use exponential backoff
- Maximum retries depend on your QStash plan
- After all retries fail, message goes to Dead Letter Queue (DLQ)

## TypeScript Support

All types are exported from `@buildbase/qstash/types`:

```typescript
import type {
  PublishOptions,
  ScheduleOptions,
  VerifyOptions,
  QStashConfig,
} from "@buildbase/qstash/types";
```

## Resources

- [Upstash QStash Documentation](https://upstash.com/docs/qstash)
- [Upstash Console](https://console.upstash.com/)
- [QStash TypeScript SDK](https://github.com/upstash/qstash-js)
