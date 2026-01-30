# Phase 2: Provider Implementations

> **Status:** ⏳ Pending  
> **Duration:** 3-4 days  
> **Branch:** `feature/email-package`  
> **Depends on:** Phase 1

## Objective

Implement all email providers (SMTP, Resend, Mailgun, SendGrid, AWS SES) with auto-detection from environment variables.

---

## User Stories

### US-2.1: Nodemailer Provider (SMTP)

**As a** developer  
**I want** to send emails via SMTP  
**So that** I can use any SMTP server (Gmail, custom, etc.)

**Acceptance Criteria:**

- [ ] Provider sends emails via SMTP
- [ ] Supports TLS/SSL configuration
- [ ] Supports attachments
- [ ] Supports custom headers
- [ ] Connection pooling for bulk sends
- [ ] Validates SMTP config on startup

### US-2.2: Resend Provider

**As a** developer  
**I want** to send emails via Resend API  
**So that** I can leverage their modern email infrastructure

**Acceptance Criteria:**

- [ ] Provider sends via Resend REST API
- [ ] Supports all Resend features (tags, metadata)
- [ ] Handles rate limiting gracefully
- [ ] Returns Resend message IDs

### US-2.3: Mailgun Provider

**As a** developer  
**I want** to send emails via Mailgun  
**So that** I can use their reliable delivery service

**Acceptance Criteria:**

- [ ] Provider sends via Mailgun API
- [ ] Supports EU/US regions
- [ ] Supports tags and tracking options
- [ ] Handles API errors properly

### US-2.4: SendGrid Provider

**As a** developer  
**I want** to send emails via SendGrid  
**So that** I can use their enterprise email platform

**Acceptance Criteria:**

- [ ] Provider sends via SendGrid v3 API
- [ ] Supports categories and custom args
- [ ] Supports SendGrid templates (optional)
- [ ] Handles API errors properly

### US-2.5: AWS SES Provider

**As a** developer  
**I want** to send emails via AWS SES  
**So that** I can use cost-effective high-volume sending

**Acceptance Criteria:**

- [ ] Provider sends via AWS SES SDK
- [ ] Supports IAM role authentication
- [ ] Supports explicit credentials
- [ ] Handles SES-specific errors (sandbox, quotas)

### US-2.6: Provider Auto-Detection

**As a** developer  
**I want** the system to auto-detect the best provider  
**So that** I don't need to explicitly configure it

**Acceptance Criteria:**

- [ ] Detects provider from available env vars
- [ ] Priority: explicit > resend > mailgun > sendgrid > smtp > ses > console
- [ ] Logs which provider was selected
- [ ] Falls back gracefully

### US-2.7: Provider Registry

**As a** developer  
**I want** a registry of all available providers  
**So that** I can list and query providers programmatically

**Acceptance Criteria:**

- [ ] `getAvailableProviders()` returns list
- [ ] `isProviderConfigured(name)` checks env
- [ ] Registry is extensible for custom providers

### US-2.8: Integration Tests

**As a** developer  
**I want** integration tests for each provider  
**So that** I can verify they work correctly

**Acceptance Criteria:**

- [ ] Test suite for each provider
- [ ] Tests can run against real services (optional)
- [ ] Mock tests for CI/CD
- [ ] Tests verify error handling

---

## Technical Specification

### Directory Structure

```
packages/email/src/providers/
├── index.ts              # Registry + exports
├── base.provider.ts      # Abstract base (from Phase 1)
├── console.provider.ts   # Dev mode (from Phase 1)
├── nodemailer.provider.ts
├── resend.provider.ts
├── mailgun.provider.ts
├── sendgrid.provider.ts
└── ses.provider.ts
```

### Nodemailer Provider

```typescript
// src/providers/nodemailer.provider.ts
import nodemailer from "nodemailer";

export class NodemailerProvider extends BaseProvider {
  readonly name = "nodemailer";
  readonly envKeys = [
    "EMAIL_SMTP_HOST",
    "EMAIL_SMTP_PORT",
    "EMAIL_SMTP_USER",
    "EMAIL_SMTP_PASS",
  ];

  private transporter: nodemailer.Transporter;

  constructor(config: EmailConfig) {
    super(config);
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
      secure: process.env.EMAIL_SMTP_SECURE === "true",
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS,
      },
    });
  }

  async send(options: SendEmailOptions): Promise<SendResult> {
    const info = await this.transporter.sendMail({
      from: this.formatFrom(options.from),
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
      headers: options.headers,
    });

    return {
      success: true,
      messageId: info.messageId,
      provider: this.name,
      timestamp: new Date(),
    };
  }
}
```

### Resend Provider

```typescript
// src/providers/resend.provider.ts
import { Resend } from "resend";

export class ResendProvider extends BaseProvider {
  readonly name = "resend";
  readonly envKeys = ["RESEND_API_KEY"];

  private client: Resend;

  constructor(config: EmailConfig) {
    super(config);
    this.client = new Resend(process.env.RESEND_API_KEY);
  }

  async send(options: SendEmailOptions): Promise<SendResult> {
    const { data, error } = await this.client.emails.send({
      from: this.formatFrom(options.from),
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
      tags: options.tags?.map(t => ({ name: t, value: "true" })),
    });

    if (error) {
      return {
        success: false,
        messageId: "",
        provider: this.name,
        timestamp: new Date(),
        errors: [error.message],
      };
    }

    return {
      success: true,
      messageId: data!.id,
      provider: this.name,
      timestamp: new Date(),
    };
  }
}
```

### Mailgun Provider

```typescript
// src/providers/mailgun.provider.ts
import formData from "form-data";
import Mailgun from "mailgun.js";

export class MailgunProvider extends BaseProvider {
  readonly name = "mailgun";
  readonly envKeys = ["MAILGUN_API_KEY", "MAILGUN_DOMAIN"];

  private client: any;
  private domain: string;

  constructor(config: EmailConfig) {
    super(config);
    const mailgun = new Mailgun(formData);
    this.client = mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY!,
      url: process.env.MAILGUN_API_URL || "https://api.mailgun.net",
    });
    this.domain = process.env.MAILGUN_DOMAIN!;
  }

  async send(options: SendEmailOptions): Promise<SendResult> {
    const result = await this.client.messages.create(this.domain, {
      from: this.formatFrom(options.from),
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      "h:Reply-To": options.replyTo,
      "o:tag": options.tags,
    });

    return {
      success: true,
      messageId: result.id,
      provider: this.name,
      timestamp: new Date(),
    };
  }
}
```

### SendGrid Provider

```typescript
// src/providers/sendgrid.provider.ts
import sgMail from "@sendgrid/mail";

export class SendGridProvider extends BaseProvider {
  readonly name = "sendgrid";
  readonly envKeys = ["SENDGRID_API_KEY"];

  constructor(config: EmailConfig) {
    super(config);
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async send(options: SendEmailOptions): Promise<SendResult> {
    const [response] = await sgMail.send({
      from: this.formatFromObject(options.from),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      categories: options.tags,
      customArgs: options.metadata as Record<string, string>,
    });

    return {
      success: response.statusCode >= 200 && response.statusCode < 300,
      messageId: response.headers["x-message-id"] as string,
      provider: this.name,
      timestamp: new Date(),
    };
  }
}
```

### AWS SES Provider

```typescript
// src/providers/ses.provider.ts
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export class SESProvider extends BaseProvider {
  readonly name = "ses";
  readonly envKeys = ["AWS_REGION"];

  private client: SESClient;

  constructor(config: EmailConfig) {
    super(config);
    this.client = new SESClient({
      region: process.env.AWS_REGION,
      credentials: process.env.AWS_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          }
        : undefined, // Use IAM role
    });
  }

  async send(options: SendEmailOptions): Promise<SendResult> {
    const command = new SendEmailCommand({
      Source: this.formatFrom(options.from),
      Destination: {
        ToAddresses: Array.isArray(options.to) ? options.to : [options.to],
        CcAddresses: options.cc,
        BccAddresses: options.bcc,
      },
      Message: {
        Subject: { Data: options.subject },
        Body: {
          Html: { Data: options.html },
          Text: options.text ? { Data: options.text } : undefined,
        },
      },
      ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined,
    });

    const response = await this.client.send(command);

    return {
      success: true,
      messageId: response.MessageId!,
      provider: this.name,
      timestamp: new Date(),
    };
  }
}
```

### Provider Registry

```typescript
// src/providers/index.ts

const PROVIDER_PRIORITY: ProviderType[] = [
  "resend",
  "mailgun",
  "sendgrid",
  "nodemailer",
  "ses",
  "console",
];

export function detectProvider(): ProviderType {
  // Explicit config takes priority
  if (process.env.EMAIL_PROVIDER) {
    return process.env.EMAIL_PROVIDER as ProviderType;
  }

  // Auto-detect from env vars
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN)
    return "mailgun";
  if (process.env.SENDGRID_API_KEY) return "sendgrid";
  if (process.env.EMAIL_SMTP_HOST) return "nodemailer";
  if (process.env.AWS_REGION && process.env.AWS_SES_ENABLED === "true")
    return "ses";

  return "console";
}

export function getAvailableProviders(): ProviderType[] {
  return PROVIDER_PRIORITY.filter(p => isProviderConfigured(p));
}

export function isProviderConfigured(provider: ProviderType): boolean {
  const envKeys = PROVIDER_ENV_KEYS[provider];
  return envKeys.every(key => !!process.env[key]);
}
```

---

## Environment Variables

```bash
# Provider Selection (optional - auto-detects if not set)
EMAIL_PROVIDER=resend

# SMTP (Nodemailer)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=user@gmail.com
EMAIL_SMTP_PASS=app-password
EMAIL_SMTP_SECURE=false

# Resend
RESEND_API_KEY=re_xxxxx

# Mailgun
MAILGUN_API_KEY=key-xxxxx
MAILGUN_DOMAIN=mail.yourapp.com
MAILGUN_API_URL=https://api.eu.mailgun.net  # For EU

# SendGrid
SENDGRID_API_KEY=SG.xxxxx

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...      # Optional if using IAM role
AWS_SECRET_ACCESS_KEY=xxxxx    # Optional if using IAM role
AWS_SES_ENABLED=true
```

---

## Dependencies

```json
{
  "dependencies": {
    "nodemailer": "^6.9.0",
    "resend": "^2.0.0",
    "mailgun.js": "^9.0.0",
    "@sendgrid/mail": "^8.0.0",
    "@aws-sdk/client-ses": "^3.0.0"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.0"
  }
}
```

---

## Definition of Done

- [ ] All 5 providers implemented
- [ ] Auto-detection working
- [ ] Unit tests for each provider
- [ ] Integration tests (optional, env-gated)
- [ ] All providers handle errors gracefully
- [ ] Documentation updated

---

## Estimated Effort

| Task                | Hours               |
| ------------------- | ------------------- |
| Nodemailer provider | 4h                  |
| Resend provider     | 3h                  |
| Mailgun provider    | 3h                  |
| SendGrid provider   | 3h                  |
| AWS SES provider    | 4h                  |
| Auto-detection      | 2h                  |
| Provider registry   | 2h                  |
| Integration tests   | 4h                  |
| **Total**           | **~25h (3-4 days)** |
