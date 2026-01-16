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
- `@buildbase/qstash/config` - Configuration helpers
- `@buildbase/qstash/types` - TypeScript types

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

## Webhook Verification

### Verify Incoming Webhooks

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

### API Route Handler

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
