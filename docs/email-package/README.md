# @buildbase/email Package

Enterprise-grade email package with multi-provider support, template management, and queue integration.

## Overview

| Feature            | Description                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| **Multi-Provider** | **Database-driven** — Add unlimited providers from Admin UI (SMTP, Resend, Mailgun, SendGrid, AWS SES) |
| **Templates**      | Full CRUD with Handlebars rendering and variable interpolation                                         |
| **Queue**          | QStash integration for delayed/scheduled sends                                                         |
| **Tracking**       | **ON by default** — Every email tracked (opens via pixel, clicks via link rewriting)                   |
| **Compliance**     | CAN-SPAM, GDPR, one-click unsubscribe                                                                  |

## Development Phases

| Phase                                              | Status         | PRD                                  |
| -------------------------------------------------- | -------------- | ------------------------------------ |
| [Phase 1: Core Foundation](./prds/PHASE-1-CORE.md) | 🔄 In Progress | Types, Factory, Console Provider     |
| [Phase 2: Providers](./prds/PHASE-2-PROVIDERS.md)  | ⏳ Pending     | SMTP, Resend, Mailgun, SendGrid, SES |
| [Phase 3: Templates](./prds/PHASE-3-TEMPLATES.md)  | ⏳ Pending     | CRUD, Rendering, Variables           |
| [Phase 4: Queue](./prds/PHASE-4-QUEUE.md)          | ⏳ Pending     | QStash, Scheduling, Retry            |
| [Phase 5: Tracking](./prds/PHASE-5-TRACKING.md)    | ⏳ Pending     | Opens, Clicks, Compliance            |
| [Phase 6: Polish](./prds/PHASE-6-POLISH.md)        | ⏳ Pending     | Docs, Error Handling, Logging        |

## Quick Start

```typescript
import { sendEmail, EmailService, EmailQueue } from '@buildbase/email';

// Simple send
await sendEmail({
  to: 'user@example.com',
  subject: 'Hello!',
  html: '<h1>Welcome</h1>',
});

// With specific provider
await EmailService.sendWith('resend', { ... });

// With template
await EmailService.sendTemplate('welcome', {
  to: 'user@example.com',
  variables: { userName: 'John' },
});

// Delayed send (5 minutes)
await EmailQueue.delay(emailOptions, '5m');

// Scheduled send
await EmailQueue.schedule(emailOptions, new Date('2024-02-01T09:00:00Z'));
```

## Environment Variables

```bash
EMAIL_PROVIDER=resend  # resend|mailgun|sendgrid|nodemailer|ses|console
EMAIL_FROM_NAME="Your App"
EMAIL_FROM_ADDRESS=noreply@yourapp.com

# Provider-specific (see individual PRDs)
RESEND_API_KEY=re_xxxxx
# ... etc
```
