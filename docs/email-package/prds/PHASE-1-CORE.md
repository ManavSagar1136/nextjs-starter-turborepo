# Phase 1: Core Foundation

> **Status:** 🔄 In Progress  
> **Duration:** 3-4 days  
> **Branch:** `feature/email-package`

## Objective

Build the foundational package structure with core types, factory pattern, and a working console provider for development.

---

## User Stories

### US-1.1: Package Setup

**As a** developer  
**I want** a properly configured TypeScript package  
**So that** I can import `@buildbase/email` in other packages

**Acceptance Criteria:**

- [ ] Package created at `packages/email/`
- [ ] `package.json` with proper name, version, exports
- [ ] `tsconfig.json` extending root config
- [ ] Proper exports in `src/index.ts`
- [ ] Package builds without errors

### US-1.2: Core Types

**As a** developer  
**I want** well-defined TypeScript interfaces  
**So that** I have type safety when working with emails

**Acceptance Criteria:**

- [ ] `EmailProvider` interface defined
- [ ] `SendEmailOptions` interface with all fields
- [ ] `SendResult` interface for responses
- [ ] `EmailConfig` type for configuration
- [ ] All types exported from package

### US-1.3: Configuration Management

**As a** developer  
**I want** centralized configuration from environment  
**So that** I can easily configure the email system

**Acceptance Criteria:**

- [ ] Config loads from environment variables
- [ ] Sensible defaults for all optional values
- [ ] Type-safe config object
- [ ] Validation for required config

### US-1.4: Factory Pattern

**As a** developer  
**I want** a factory that creates email providers  
**So that** I can switch providers without code changes

**Acceptance Criteria:**

- [ ] `EmailFactory` singleton class
- [ ] `getProvider(name?)` returns provider instance
- [ ] Auto-detects default provider from env
- [ ] Caches provider instances
- [ ] Falls back to console provider if none configured

### US-1.5: Base Provider

**As a** developer  
**I want** an abstract base provider class  
**So that** all providers share common functionality

**Acceptance Criteria:**

- [ ] Abstract `BaseProvider` class
- [ ] Common validation logic
- [ ] Shared error handling
- [ ] Provider name and env keys properties

### US-1.6: Console Provider

**As a** developer  
**I want** a console provider for development  
**So that** I can test email flows without sending real emails

**Acceptance Criteria:**

- [ ] Logs email details to console
- [ ] Formats output nicely (subject, to, html preview)
- [ ] Returns mock successful response
- [ ] No external dependencies required

### US-1.7: Email Service

**As a** developer  
**I want** a simple `sendEmail()` function  
**So that** I can send emails with minimal code

**Acceptance Criteria:**

- [ ] `sendEmail(options)` function exported
- [ ] Uses factory to get provider
- [ ] Validates input before sending
- [ ] Returns typed result

### US-1.8: Unit Tests

**As a** developer  
**I want** comprehensive unit tests  
**So that** I can refactor with confidence

**Acceptance Criteria:**

- [ ] Tests for factory pattern
- [ ] Tests for console provider
- [ ] Tests for email service
- [ ] Tests for config loading
- [ ] All tests pass

---

## Technical Specification

### Directory Structure

```
packages/email/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── index.ts
│   ├── core/
│   │   ├── types.ts
│   │   ├── config.ts
│   │   ├── errors.ts
│   │   └── constants.ts
│   ├── providers/
│   │   ├── index.ts
│   │   ├── base.provider.ts
│   │   └── console.provider.ts
│   ├── factory/
│   │   └── email.factory.ts
│   └── service/
│       └── email.service.ts
└── __tests__/
    ├── factory.test.ts
    ├── console-provider.test.ts
    └── email-service.test.ts
```

### Core Types

```typescript
// src/core/types.ts

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface Attachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: EmailAddress;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Attachment[];
  headers?: Record<string, string>;
  tags?: string[];
  metadata?: Record<string, unknown>;

  // Tracking (enabled by default)
  trackingId?: string; // Auto-generated if not provided
  disableTracking?: boolean; // Set true to disable (default: false)
}

export interface SendResult {
  success: boolean;
  messageId: string;
  provider: string;
  timestamp: Date;
  trackingId: string; // Always returned for tracking
  errors?: string[];
}

export interface BulkSendResult {
  total: number;
  successful: SendResult[];
  failed: Array<{ email: string; error: string }>;
}

export interface EmailProvider {
  readonly name: string;
  readonly envKeys: string[];

  send(options: SendEmailOptions): Promise<SendResult>;
  sendBulk?(emails: SendEmailOptions[]): Promise<BulkSendResult>;
  validateConfig(): boolean;
}

export type ProviderType =
  | "console"
  | "nodemailer"
  | "resend"
  | "mailgun"
  | "sendgrid"
  | "ses";
```

### Configuration

```typescript
// src/core/config.ts

export interface EmailConfig {
  provider: ProviderType;
  from: EmailAddress;
  replyTo?: string;

  // Provider-specific
  smtp?: SmtpConfig;
  resend?: { apiKey: string };
  mailgun?: { apiKey: string; domain: string };
  sendgrid?: { apiKey: string };
  ses?: { region: string; accessKeyId?: string; secretAccessKey?: string };
}

export function loadConfig(): EmailConfig {
  return {
    provider: (process.env.EMAIL_PROVIDER as ProviderType) || "console",
    from: {
      email: process.env.EMAIL_FROM_ADDRESS || "noreply@example.com",
      name: process.env.EMAIL_FROM_NAME || "System",
    },
    replyTo: process.env.EMAIL_REPLY_TO,
    // ... provider configs
  };
}
```

### Factory

```typescript
// src/factory/email.factory.ts

export class EmailFactory {
  private static instance: EmailFactory;
  private providers = new Map<string, EmailProvider>();
  private config: EmailConfig;

  private constructor() {
    this.config = loadConfig();
  }

  static getInstance(): EmailFactory {
    if (!this.instance) {
      this.instance = new EmailFactory();
    }
    return this.instance;
  }

  getProvider(name?: ProviderType): EmailProvider {
    const providerName = name || this.config.provider;

    if (!this.providers.has(providerName)) {
      this.providers.set(providerName, this.createProvider(providerName));
    }

    return this.providers.get(providerName)!;
  }

  private createProvider(name: ProviderType): EmailProvider {
    switch (name) {
      case "console":
        return new ConsoleProvider(this.config);
      // Future: other providers
      default:
        console.warn(`Unknown provider "${name}", falling back to console`);
        return new ConsoleProvider(this.config);
    }
  }
}
```

### Email Service

```typescript
// src/service/email.service.ts

export class EmailService {
  private static factory = EmailFactory.getInstance();

  static async send(options: SendEmailOptions): Promise<SendResult> {
    const provider = this.factory.getProvider();
    return provider.send(options);
  }

  static async sendWith(
    providerName: ProviderType,
    options: SendEmailOptions
  ): Promise<SendResult> {
    const provider = this.factory.getProvider(providerName);
    return provider.send(options);
  }

  static async sendBulk(emails: SendEmailOptions[]): Promise<BulkSendResult> {
    const provider = this.factory.getProvider();
    if (provider.sendBulk) {
      return provider.sendBulk(emails);
    }
    // Fallback: sequential sends
    const results = await Promise.allSettled(
      emails.map(email => provider.send(email))
    );
    // ... process results
  }

  static getProviderName(): string {
    return this.factory.getProvider().name;
  }
}

// Convenience function
export async function sendEmail(
  options: SendEmailOptions
): Promise<SendResult> {
  return EmailService.send(options);
}
```

---

## Environment Variables

```bash
# Required for Phase 1
EMAIL_PROVIDER=console          # console (default for dev)
EMAIL_FROM_NAME="Your App"
EMAIL_FROM_ADDRESS=noreply@yourapp.com
EMAIL_REPLY_TO=support@yourapp.com  # optional
```

---

## Definition of Done

- [ ] All user stories completed
- [ ] Package builds successfully
- [ ] All tests passing
- [ ] `sendEmail()` works with console provider
- [ ] Code reviewed and merged
- [ ] Documentation updated

---

## Dependencies

- None (Phase 1 has no external dependencies)

---

## Estimated Effort

| Task              | Hours             |
| ----------------- | ----------------- |
| Package setup     | 2h                |
| Core types        | 2h                |
| Config management | 2h                |
| Base provider     | 2h                |
| Console provider  | 2h                |
| Factory pattern   | 3h                |
| Email service     | 2h                |
| Unit tests        | 4h                |
| Documentation     | 2h                |
| **Total**         | **~21h (3 days)** |
