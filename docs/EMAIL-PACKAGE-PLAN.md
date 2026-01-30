# Email Package Plan - @buildbase/email

## Overview

Add a reusable email package to nextjs-starter-turborepo with factory pattern supporting multiple providers (SMTP/Nodemailer, Resend, Mailgun, SendGrid, AWS SES).

**Reference Implementation:** [org-based-saas-developer-template/src/lib/email](https://github.com/SaaS-Developer-Template/org-based-saas-developer-template)

---

## Architecture

```
packages/email/
├── package.json
├── tsconfig.json
├── eslint.config.ts
├── vitest.config.ts
├── PRD.md
├── README.md
├── CONFIGURATION.md
└── src/
    ├── index.ts                    # Public exports
    ├── types.ts                    # Interfaces & types
    ├── config.ts                   # Centralized configuration
    ├── factory.ts                  # Provider factory (singleton)
    ├── service.ts                  # Main EmailService class
    ├── validation.ts               # Email validation & sanitization
    ├── retry.ts                    # Retry logic with exponential backoff
    ├── tracking.ts                 # Open/click tracking (optional)
    ├── providers/
    │   ├── base.provider.ts        # Abstract base class
    │   ├── nodemailer.provider.ts  # SMTP via Nodemailer
    │   ├── resend.provider.ts      # Resend API
    │   ├── mailgun.provider.ts     # Mailgun API
    │   ├── sendgrid.provider.ts    # SendGrid API (NEW)
    │   ├── ses.provider.ts         # AWS SES (NEW)
    │   └── console.provider.ts     # Dev/test - logs to console
    └── __tests__/
        ├── service.test.ts
        ├── factory.test.ts
        ├── providers/
        │   ├── nodemailer.test.ts
        │   ├── resend.test.ts
        │   └── console.test.ts
        └── validation.test.ts
```

---

## Provider Support

| Provider              | Priority | Status       | Env Variables                                                                          |
| --------------------- | -------- | ------------ | -------------------------------------------------------------------------------------- |
| **Nodemailer (SMTP)** | P0       | ✅ Reference | `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD` |
| **Resend**            | P0       | ✅ Reference | `RESEND_API_KEY`                                                                       |
| **Mailgun**           | P1       | ✅ Reference | `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`                                                    |
| **SendGrid**          | P1       | 🆕 New       | `SENDGRID_API_KEY`                                                                     |
| **AWS SES**           | P2       | 🆕 New       | `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`                             |
| **Console**           | P0       | 🆕 New       | None (dev mode)                                                                        |

---

## Core Types

```typescript
// types.ts

export interface EmailSendOptions {
  to: string | string[]; // Single or multiple recipients
  subject: string;
  html: string;
  text?: string; // Plain text alternative
  from?: {
    name: string;
    address: string;
  };
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  // Tracking (optional)
  emailId?: string;
  trackingEnabled?: boolean;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  encoding?: "base64" | "utf8";
}

export interface EmailSendResult {
  success: boolean;
  messageId: string;
  provider: string;
  timestamp: Date;
  errors?: string[];
}

export interface EmailProvider {
  name: string;
  sendEmail(options: EmailSendOptions): Promise<EmailSendResult>;
  validateConfig(): boolean;
}

export type EmailProviderType =
  | "nodemailer"
  | "resend"
  | "mailgun"
  | "sendgrid"
  | "ses"
  | "console";
```

---

## Configuration

```typescript
// config.ts

export const EmailConfig = {
  // Default sender
  defaults: {
    fromName: process.env.EMAIL_FROM_NAME || "System",
    fromAddress: process.env.EMAIL_FROM || "noreply@example.com",
  },

  // Available providers
  providers: {
    NODEMAILER: "nodemailer",
    RESEND: "resend",
    MAILGUN: "mailgun",
    SENDGRID: "sendgrid",
    SES: "ses",
    CONSOLE: "console",
  } as const,

  // Retry settings
  retry: {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
  },

  // Validation
  validation: {
    maxSubjectLength: 998,
    maxEmailSize: 10 * 1024 * 1024, // 10MB
    maxRecipients: 100,
  },

  // Security
  security: {
    sanitizeHtml: true,
    forbiddenTags: ["script", "iframe", "object", "embed", "form"],
    forbiddenAttributes: ["onclick", "onerror", "onload"],
  },
} as const;
```

---

## Factory Pattern

```typescript
// factory.ts

import { EmailConfig, EmailProviderType } from "./config";
import { EmailProvider } from "./types";
import { NodemailerProvider } from "./providers/nodemailer.provider";
import { ResendProvider } from "./providers/resend.provider";
import { MailgunProvider } from "./providers/mailgun.provider";
import { SendGridProvider } from "./providers/sendgrid.provider";
import { SESProvider } from "./providers/ses.provider";
import { ConsoleProvider } from "./providers/console.provider";

export class EmailFactory {
  private static instance: EmailFactory;
  private providers: Map<EmailProviderType, EmailProvider> = new Map();
  private defaultProvider: EmailProviderType;

  private constructor() {
    this.defaultProvider =
      (process.env.EMAIL_PROVIDER as EmailProviderType) || "console";
  }

  static getInstance(): EmailFactory {
    if (!EmailFactory.instance) {
      EmailFactory.instance = new EmailFactory();
    }
    return EmailFactory.instance;
  }

  getProvider(type?: EmailProviderType): EmailProvider {
    const providerType = type || this.defaultProvider;

    if (!this.providers.has(providerType)) {
      this.providers.set(providerType, this.createProvider(providerType));
    }

    return this.providers.get(providerType)!;
  }

  private createProvider(type: EmailProviderType): EmailProvider {
    switch (type) {
      case "nodemailer":
        return new NodemailerProvider();
      case "resend":
        return new ResendProvider();
      case "mailgun":
        return new MailgunProvider();
      case "sendgrid":
        return new SendGridProvider();
      case "ses":
        return new SESProvider();
      case "console":
      default:
        return new ConsoleProvider();
    }
  }
}
```

---

## Email Service

```typescript
// service.ts

export class EmailService {
  private static factory = EmailFactory.getInstance();

  /**
   * Send an email using the default provider
   */
  static async send(options: EmailSendOptions): Promise<EmailSendResult> {
    const provider = this.factory.getProvider();
    return this.sendWithProvider(provider, options);
  }

  /**
   * Send an email using a specific provider
   */
  static async sendWith(
    providerType: EmailProviderType,
    options: EmailSendOptions
  ): Promise<EmailSendResult> {
    const provider = this.factory.getProvider(providerType);
    return this.sendWithProvider(provider, options);
  }

  /**
   * Send with retry logic
   */
  private static async sendWithProvider(
    provider: EmailProvider,
    options: EmailSendOptions
  ): Promise<EmailSendResult> {
    // 1. Validate
    const validation = validateEmail(options);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors, ... };
    }

    // 2. Sanitize HTML
    const sanitizedOptions = sanitizeEmailContent(options);

    // 3. Send with retry
    return retryEmailSend(() => provider.sendEmail(sanitizedOptions));
  }

  /**
   * Send bulk emails
   */
  static async sendBulk(
    emails: EmailSendOptions[]
  ): Promise<{ successful: EmailSendResult[]; failed: any[] }> {
    // ... bulk sending with concurrency control
  }

  /**
   * Validate provider configuration
   */
  static validateConfig(): boolean {
    return this.factory.getProvider().validateConfig();
  }
}
```

---

## Usage Examples

### Basic Usage

```typescript
import { EmailService, sendEmail } from "@buildbase/email";

// Using the service class
await EmailService.send({
  to: "user@example.com",
  subject: "Welcome!",
  html: "<h1>Hello</h1>",
});

// Using convenience function
await sendEmail({
  to: "user@example.com",
  subject: "Welcome!",
  html: "<h1>Hello</h1>",
});
```

### Override Provider

```typescript
import { EmailService } from "@buildbase/email";

// Force use Resend for this email
await EmailService.sendWith("resend", {
  to: "user@example.com",
  subject: "Important",
  html: "<p>This goes through Resend</p>",
});
```

### Bulk Sending

```typescript
import { EmailService } from "@buildbase/email";

const emails = users.map(user => ({
  to: user.email,
  subject: "Newsletter",
  html: renderNewsletter(user),
}));

const { successful, failed } = await EmailService.sendBulk(emails);
console.log(`Sent: ${successful.length}, Failed: ${failed.length}`);
```

### With Attachments

```typescript
await sendEmail({
  to: "user@example.com",
  subject: "Your Invoice",
  html: "<p>Please find attached.</p>",
  attachments: [
    {
      filename: "invoice.pdf",
      content: pdfBuffer,
      contentType: "application/pdf",
    },
  ],
});
```

---

## Environment Variables

```bash
# Provider selection
EMAIL_PROVIDER=nodemailer  # nodemailer | resend | mailgun | sendgrid | ses | console

# Default sender
EMAIL_FROM_NAME="My App"
EMAIL_FROM=noreply@myapp.com

# Nodemailer (SMTP)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=user@gmail.com
EMAIL_SERVER_PASSWORD=app-password

# Resend
RESEND_API_KEY=re_xxxxx

# Mailgun
MAILGUN_API_KEY=key-xxxxx
MAILGUN_DOMAIN=mg.myapp.com

# SendGrid
SENDGRID_API_KEY=SG.xxxxx

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxxxx
```

---

## Dependencies

```json
{
  "dependencies": {
    "nodemailer": "^6.9.0",
    "resend": "^4.0.0",
    "mailgun.js": "^10.0.0",
    "@sendgrid/mail": "^8.0.0",
    "@aws-sdk/client-ses": "^3.0.0",
    "zod": "^3.23.0"
  },
  "peerDependencies": {
    "nodemailer": ">=6.9.0"
  },
  "peerDependenciesMeta": {
    "resend": { "optional": true },
    "mailgun.js": { "optional": true },
    "@sendgrid/mail": { "optional": true },
    "@aws-sdk/client-ses": { "optional": true }
  }
}
```

---

## Development Phases

### Phase 1: Core Foundation (2-3 days)

- [ ] Package setup (package.json, tsconfig, etc.)
- [ ] Types and interfaces
- [ ] Configuration system
- [ ] Factory pattern implementation
- [ ] Console provider (for dev/test)
- [ ] Basic validation
- [ ] Unit tests

### Phase 2: SMTP & Resend (2 days)

- [ ] Nodemailer provider (SMTP)
- [ ] Resend provider
- [ ] Email sanitization
- [ ] Retry logic
- [ ] Integration tests

### Phase 3: Additional Providers (2 days)

- [ ] Mailgun provider
- [ ] SendGrid provider
- [ ] AWS SES provider
- [ ] Provider-specific tests

### Phase 4: Advanced Features (1-2 days)

- [ ] Bulk sending with concurrency
- [ ] Attachment support
- [ ] Email tracking (open/click)
- [ ] Template support (optional)
- [ ] Documentation

---

## Migration from Reference

Key differences from org-based-saas-developer-template:

1. **Standalone package** - Not app-specific, reusable across projects
2. **Optional dependencies** - Only install providers you use
3. **No logger dependency** - Use console or accept logger as option
4. **No tracking by default** - Opt-in email tracking
5. **Simpler API** - Focus on sending, not campaign management

---

## Public API

```typescript
// index.ts - Public exports

// Main service
export { EmailService } from "./service";
export { EmailFactory } from "./factory";

// Convenience functions
export { sendEmail, sendBulkEmail } from "./service";

// Types
export type {
  EmailSendOptions,
  EmailSendResult,
  EmailProvider,
  EmailProviderType,
  EmailAttachment,
} from "./types";

// Config
export { EmailConfig } from "./config";

// Providers (for custom usage)
export { NodemailerProvider } from "./providers/nodemailer.provider";
export { ResendProvider } from "./providers/resend.provider";
export { MailgunProvider } from "./providers/mailgun.provider";
export { SendGridProvider } from "./providers/sendgrid.provider";
export { SESProvider } from "./providers/ses.provider";
export { ConsoleProvider } from "./providers/console.provider";

// Utilities
export { validateEmail, sanitizeEmailContent } from "./validation";
```

---

## Decision Points

1. **Should we include email templates?**
   - Option A: No, keep package focused on sending
   - Option B: Yes, add React Email or similar integration
   - **Recommendation:** A - Templates can be a separate package

2. **Should tracking be included?**
   - Option A: No, keep it simple
   - Option B: Yes, add open/click tracking
   - **Recommendation:** B - Include as opt-in feature

3. **Should we support queuing?**
   - Option A: No, use @buildbase/qstash for queuing
   - Option B: Yes, add built-in queue
   - **Recommendation:** A - Leverage existing qstash package

---

## Next Steps

1. Review and approve this plan
2. Create feature branch: `feature/email-package`
3. Start Phase 1 implementation
4. Code review after each phase

---

_Created: 2026-01-30_
_Author: MONA_
