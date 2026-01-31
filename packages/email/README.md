# @buildbase/email

Enterprise-grade email package with multi-provider support, template management, queue integration, and tracking.

## Features

- **Multi-Provider** — Database-driven provider management (SMTP, Resend, Mailgun, SendGrid, AWS SES)
- **Templates** — Full CRUD with Handlebars rendering and variable interpolation
- **Queue** — QStash integration for delayed/scheduled sends with retry logic
- **Tracking** — Open and click tracking enabled by default
- **Compliance** — CAN-SPAM, GDPR, one-click unsubscribe support

## Installation

```bash
# In your monorepo
yarn add @buildbase/email
```

## Quick Start

```typescript
import { EmailService, sendEmail } from "@buildbase/email";
import { prisma } from "@buildbase/database";

// Initialize once at app startup
await EmailService.initialize(prisma);

// Send a simple email
await sendEmail({
  to: "user@example.com",
  subject: "Hello!",
  html: "<h1>Welcome to our app!</h1>",
});
```

## Providers

### Database-Driven Providers

Providers are stored in the database and can be managed via Admin UI:

```typescript
import { EmailFactory } from "@buildbase/email";

// Get the default provider
const factory = EmailFactory.getInstance();
const provider = await factory.getProvider();

// Get a specific provider
const resendProvider = await factory.getProvider("provider-id");

// List all providers
const providerService = factory.getProviderService();
const providers = await providerService.list();
```

### Supported Provider Types

| Type       | Description           | Required Config                      |
| ---------- | --------------------- | ------------------------------------ |
| `CONSOLE`  | Logs to console (dev) | None                                 |
| `SMTP`     | Any SMTP server       | host, port, username, password       |
| `RESEND`   | Resend.com            | apiKey                               |
| `MAILGUN`  | Mailgun               | apiKey, domain                       |
| `SENDGRID` | SendGrid              | apiKey                               |
| `SES`      | AWS SES               | region, accessKeyId, secretAccessKey |

## Templates

### Using Templates

```typescript
import { EmailService } from "@buildbase/email";

// Send with template by slug
await EmailService.sendTemplate("welcome", {
  to: "user@example.com",
  variables: {
    userName: "John",
    activationUrl: "https://example.com/activate/abc123",
  },
});

// Send with template by ID
await EmailService.sendTemplateById("template-id", {
  to: "user@example.com",
  variables: { userName: "John" },
});
```

### Managing Templates

```typescript
import { TemplateService } from "@buildbase/email";

const templateService = new TemplateService(prisma);

// Create a template
await templateService.create({
  slug: "welcome",
  name: "Welcome Email",
  subject: "Welcome, {{userName}}!",
  html: '<h1>Hello {{userName}}</h1><p>Click <a href="{{activationUrl}}">here</a> to activate.</p>',
  category: "WELCOME",
});

// Render a template (preview)
const rendered = await templateService.renderBySlug("welcome", {
  userName: "John",
  activationUrl: "https://...",
});
```

## Queue (Delayed & Scheduled Sends)

Requires QStash configuration (`QSTASH_TOKEN`, `APP_URL`).

```typescript
import { EmailQueue, EmailService } from "@buildbase/email";

// Queue for immediate async sending
await EmailQueue.enqueue({
  to: "user@example.com",
  subject: "Queued Email",
  html: "<p>This was queued!</p>",
});

// Delayed send
await EmailQueue.delay(emailOptions, "5m"); // 5 minutes
await EmailQueue.delay(emailOptions, "2h"); // 2 hours
await EmailQueue.delay(emailOptions, 30000); // 30 seconds (ms)

// Scheduled send
await EmailQueue.schedule(emailOptions, new Date("2024-02-01T09:00:00Z"));

// Or use EmailService with queue options
await EmailService.send({
  to: "user@example.com",
  subject: "Delayed",
  html: "<p>Sent after delay</p>",
  delay: "1h",
});

// Bulk queue with staggering
await EmailQueue.enqueueBulk(emails, { delay: "1s" });
```

### Processing Endpoint

Create an API route to process queued emails:

```typescript
// /api/email/process
import { processQueuedEmail } from "@buildbase/email";

export async function POST(req: Request) {
  const result = await processQueuedEmail(req);

  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: result.error === "Invalid signature" ? 401 : 500,
    });
  }

  return Response.json(result);
}
```

## Tracking

Tracking is **enabled by default** for all emails.

### How It Works

- **Open Tracking**: 1x1 transparent pixel inserted into HTML
- **Click Tracking**: Links rewritten to track clicks

### Disabling Tracking

```typescript
await sendEmail({
  to: "user@example.com",
  subject: "No Tracking",
  html: "<p>This email is not tracked</p>",
  disableTracking: true,
});
```

### Tracking Endpoints

Create API routes for tracking:

```typescript
// GET /api/track/open/[trackingId]
import { getTrackingService, getTransparentPixel } from "@buildbase/email";

export async function GET(
  req: Request,
  { params }: { params: { trackingId: string } }
) {
  const tracking = getTrackingService(prisma);
  await tracking.recordOpen(params.trackingId, {
    ipAddress: req.headers.get("x-forwarded-for"),
    userAgent: req.headers.get("user-agent"),
  });

  return new Response(getTransparentPixel(), {
    headers: { "Content-Type": "image/gif" },
  });
}

// GET /api/track/click/[trackingId]
export async function GET(
  req: Request,
  { params }: { params: { trackingId: string } }
) {
  const url = new URL(req.url).searchParams.get("url");

  const tracking = getTrackingService(prisma);
  await tracking.recordClick(params.trackingId, url!, {
    ipAddress: req.headers.get("x-forwarded-for"),
    userAgent: req.headers.get("user-agent"),
  });

  return Response.redirect(url!);
}
```

### Getting Metrics

```typescript
import { getTrackingService } from "@buildbase/email";

const tracking = getTrackingService(prisma);
const metrics = await tracking.getMetrics(trackingId);

console.log(metrics);
// {
//   trackingId: '...',
//   opened: true,
//   openCount: 3,
//   uniqueOpens: 2,
//   clicked: true,
//   clickCount: 5,
//   clickedLinks: [{ url: '...', count: 3 }],
//   ...
// }
```

## Compliance

### Unsubscribe

```typescript
import { getUnsubscribeService, generateUnsubscribeUrl } from "@buildbase/email";

const unsubService = getUnsubscribeService(prisma);

// Get unsubscribe URL for an email
const url = await unsubService.getUnsubscribeUrl("user@example.com");

// Check if user can receive a category
const canReceive = await unsubService.canReceive(
  "user@example.com",
  "marketing"
);

// Unsubscribe
await unsubService.unsubscribeAll(token);
```

### Headers

Compliance headers are automatically added:

- `List-Unsubscribe`
- `List-Unsubscribe-Post` (one-click)
- `Message-ID`

## Health Check

```typescript
import { healthCheck, quickHealthCheck, sendTestEmail } from "@buildbase/email";

// Quick check
const quick = quickHealthCheck();
// { initialized: true, queueConfigured: true }

// Full health check
const health = await healthCheck(prisma);
// { status: 'healthy', components: {...}, providers: [...] }

// Send test email
const test = await sendTestEmail("admin@example.com");
// { success: true, messageId: '...' }
```

## Validation

```typescript
import { validateEmail, validateSendOptions, normalizeEmail } from "@buildbase/email";

// Validate email format
validateEmail("user@example.com"); // true

// Normalize email
normalizeEmail("User@Example.COM"); // 'user@example.com'

// Validate send options
const result = validateSendOptions({
  to: "user@example.com",
  subject: "Hello",
  html: "<p>Hi</p>",
});
// { valid: true, errors: [] }
```

## Environment Variables

```bash
# App URL (required for tracking & queue)
APP_URL=https://yourapp.com

# QStash (optional - for queue)
QSTASH_TOKEN=xxxxx
QSTASH_CURRENT_SIGNING_KEY=sig_xxxxx
QSTASH_NEXT_SIGNING_KEY=sig_xxxxx

# Encryption key for provider configs
EMAIL_ENCRYPTION_KEY=your-32-byte-key

# Global tracking disable (optional)
EMAIL_TRACKING_DISABLED=false
```

## Error Handling

```typescript
import {
  EmailError,
  ProviderError,
  ValidationError,
  TemplateNotFoundError,
  RateLimitError,
} from '@buildbase/email';

try {
  await sendEmail({ ... });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Invalid input:', error.field, error.message);
  } else if (error instanceof ProviderError) {
    console.log('Provider failed:', error.provider, error.message);
  } else if (error instanceof RateLimitError) {
    console.log('Rate limited, retry after:', error.retryAfterMs);
  }
}
```

## API Reference

### EmailService

| Method                        | Description                         |
| ----------------------------- | ----------------------------------- |
| `initialize(prisma)`          | Initialize with Prisma client       |
| `send(options)`               | Send email (supports queue options) |
| `sendDirect(options)`         | Send immediately (no queue)         |
| `sendTemplate(slug, options)` | Send with template                  |
| `sendBulk(emails, options)`   | Send multiple emails                |
| `delay(email, delay)`         | Queue with delay                    |
| `schedule(email, date)`       | Schedule for specific time          |

### EmailQueue

| Method                         | Description            |
| ------------------------------ | ---------------------- |
| `enqueue(email, options)`      | Queue single email     |
| `delay(email, delay)`          | Queue with delay       |
| `schedule(email, date)`        | Schedule for time      |
| `enqueueBulk(emails, options)` | Queue multiple         |
| `cancel(messageId)`            | Cancel scheduled email |

### TrackingService

| Method                               | Description               |
| ------------------------------------ | ------------------------- |
| `addTracking(html, context)`         | Add pixel & rewrite links |
| `recordOpen(trackingId, info)`       | Record open event         |
| `recordClick(trackingId, url, info)` | Record click event        |
| `getMetrics(trackingId)`             | Get email metrics         |

## License

MIT
