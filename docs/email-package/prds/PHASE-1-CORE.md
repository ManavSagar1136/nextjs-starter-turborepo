# Phase 1: Core Foundation

> **Status:** 🔄 In Progress  
> **Duration:** 4-5 days  
> **Branch:** `feature/email-package`

## Objective

Build the foundational package structure with core types, **database-driven provider management**, factory pattern, and a working console provider for development.

---

## Key Architecture Decision

### ⚠️ Database-Driven Providers (Not Env-Based)

**Old Approach:** Providers configured via environment variables  
**New Approach:** Providers managed via Admin Panel + Database

**Benefits:**

- Add unlimited email providers from UI
- Multiple accounts per provider type (e.g., 3 SMTP servers)
- Enable/disable providers without redeployment
- Rotate credentials easily
- Per-organization provider isolation (multi-tenant)
- Audit trail for provider changes

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
- [ ] `EmailProviderConfig` type for DB-stored configs
- [ ] All types exported from package

### US-1.3: Email Provider Prisma Schema

**As an** admin  
**I want** email providers stored in the database  
**So that** I can manage them from the admin panel

**Acceptance Criteria:**

- [ ] `EmailProvider` model in Prisma schema
- [ ] Fields: id, name, type, config (encrypted JSON), isActive, isDefault
- [ ] Supports all provider types (SMTP, Resend, Mailgun, SendGrid, SES)
- [ ] Credentials encrypted at rest
- [ ] Organization scoping (multi-tenant)
- [ ] Audit fields (createdBy, updatedBy, timestamps)

### US-1.4: Provider Service (CRUD)

**As an** admin  
**I want** to create/update/delete email providers  
**So that** I can manage sending accounts

**Acceptance Criteria:**

- [ ] `createProvider(data)` creates provider in DB
- [ ] `updateProvider(id, data)` updates provider
- [ ] `deleteProvider(id)` removes provider
- [ ] `getProvider(id)` fetches single provider
- [ ] `listProviders()` lists all providers
- [ ] `getDefaultProvider()` returns active default
- [ ] Validates config before saving
- [ ] Encrypts sensitive fields (apiKey, password)

### US-1.5: Provider API Routes

**As an** admin  
**I want** REST API for provider management  
**So that** I can build an admin UI

**Acceptance Criteria:**

- [ ] `POST /api/email-providers` - Create
- [ ] `GET /api/email-providers` - List all
- [ ] `GET /api/email-providers/:id` - Get one
- [ ] `PUT /api/email-providers/:id` - Update
- [ ] `DELETE /api/email-providers/:id` - Delete
- [ ] `POST /api/email-providers/:id/test` - Test connection
- [ ] `POST /api/email-providers/:id/set-default` - Set as default
- [ ] Admin role required for all routes

### US-1.6: Factory Pattern (Database-Aware)

**As a** developer  
**I want** a factory that loads providers from DB  
**So that** I can use configured providers dynamically

**Acceptance Criteria:**

- [ ] `EmailFactory` singleton class
- [ ] `getProvider(id?)` returns provider instance from DB config
- [ ] `getDefaultProvider()` returns the default provider
- [ ] Caches provider instances (invalidates on config change)
- [ ] Falls back to console provider if none configured

### US-1.7: Base Provider Class

**As a** developer  
**I want** an abstract base provider class  
**So that** all providers share common functionality

**Acceptance Criteria:**

- [ ] Abstract `BaseProvider` class
- [ ] Accepts config from database
- [ ] Common validation logic
- [ ] Shared error handling
- [ ] Connection test method

### US-1.8: Console Provider

**As a** developer  
**I want** a console provider for development  
**So that** I can test email flows without sending real emails

**Acceptance Criteria:**

- [ ] Logs email details to console
- [ ] Formats output nicely (subject, to, html preview)
- [ ] Returns mock successful response
- [ ] No external dependencies required
- [ ] Auto-enabled when no DB providers exist

### US-1.9: Email Service

**As a** developer  
**I want** a simple `sendEmail()` function  
**So that** I can send emails with minimal code

**Acceptance Criteria:**

- [ ] `sendEmail(options)` function exported
- [ ] Uses factory to get default provider from DB
- [ ] `sendEmail(options, { providerId })` for specific provider
- [ ] Validates input before sending
- [ ] Returns typed result with trackingId

### US-1.10: Credential Encryption

**As a** security-conscious developer  
**I want** provider credentials encrypted in DB  
**So that** secrets are protected

**Acceptance Criteria:**

- [ ] Encryption key from env (`EMAIL_ENCRYPTION_KEY`)
- [ ] AES-256-GCM encryption for sensitive fields
- [ ] Decryption only when creating provider instance
- [ ] Key rotation support

### US-1.11: Unit Tests

**As a** developer  
**I want** comprehensive unit tests  
**So that** I can refactor with confidence

**Acceptance Criteria:**

- [ ] Tests for provider CRUD
- [ ] Tests for factory pattern
- [ ] Tests for console provider
- [ ] Tests for encryption/decryption
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
│   │   ├── constants.ts
│   │   └── encryption.ts
│   ├── providers/
│   │   ├── index.ts
│   │   ├── base.provider.ts
│   │   └── console.provider.ts
│   ├── factory/
│   │   └── email.factory.ts
│   ├── service/
│   │   ├── email.service.ts
│   │   └── provider.service.ts
│   └── api/
│       └── provider.routes.ts
└── __tests__/
    ├── provider.service.test.ts
    ├── factory.test.ts
    ├── console-provider.test.ts
    └── encryption.test.ts
```

### Prisma Schema

```prisma
// prisma/schema.prisma

enum EmailProviderType {
  CONSOLE
  SMTP
  RESEND
  MAILGUN
  SENDGRID
  SES
}

model EmailProvider {
  id             String            @id @default(cuid())

  // Identity
  name           String            // "Main SMTP", "Marketing Resend"
  description    String?
  type           EmailProviderType

  // Configuration (encrypted JSON)
  config         String            @db.Text  // Encrypted JSON

  // From address for this provider
  fromName       String            // "Your App"
  fromEmail      String            // "noreply@yourapp.com"
  replyTo        String?

  // Status
  isActive       Boolean           @default(true)
  isDefault      Boolean           @default(false)

  // Usage tracking
  lastUsedAt     DateTime?
  emailsSent     Int               @default(0)

  // Multi-tenant
  organizationId String?
  organization   Organization?     @relation(fields: [organizationId], references: [id])

  // Audit
  createdBy      String?
  updatedBy      String?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  @@unique([organizationId, isDefault], name: "one_default_per_org")
  @@index([type])
  @@index([isActive])
  @@index([organizationId])
}
```

### Core Types

```typescript
// src/core/types.ts

export type ProviderType =
  | "CONSOLE"
  | "SMTP"
  | "RESEND"
  | "MAILGUN"
  | "SENDGRID"
  | "SES";

// Provider-specific configs (stored encrypted in DB)
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface ResendConfig {
  apiKey: string;
}

export interface MailgunConfig {
  apiKey: string;
  domain: string;
  region?: "us" | "eu";
}

export interface SendGridConfig {
  apiKey: string;
}

export interface SesConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface ConsoleConfig {
  // No config needed
}

export type ProviderConfig =
  | { type: "CONSOLE"; config: ConsoleConfig }
  | { type: "SMTP"; config: SmtpConfig }
  | { type: "RESEND"; config: ResendConfig }
  | { type: "MAILGUN"; config: MailgunConfig }
  | { type: "SENDGRID"; config: SendGridConfig }
  | { type: "SES"; config: SesConfig };

// Email sending types
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
  from?: EmailAddress; // Override provider default
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

  // Provider selection
  providerId?: string; // Use specific provider (default: use default)
}

export interface SendResult {
  success: boolean;
  messageId: string;
  provider: string; // Provider name used
  providerId: string; // Provider ID used
  timestamp: Date;
  trackingId: string; // Always returned for tracking
  errors?: string[];
}

export interface BulkSendResult {
  total: number;
  successful: SendResult[];
  failed: Array<{ email: string; error: string }>;
}

// Provider interface
export interface EmailProviderInstance {
  readonly id: string;
  readonly name: string;
  readonly type: ProviderType;

  send(options: SendEmailOptions): Promise<SendResult>;
  sendBulk?(emails: SendEmailOptions[]): Promise<BulkSendResult>;
  testConnection(): Promise<{ success: boolean; error?: string }>;
}

// CRUD types
export interface CreateProviderInput {
  name: string;
  description?: string;
  type: ProviderType;
  config: Record<string, unknown>; // Type-specific config
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  isDefault?: boolean;
  organizationId?: string;
}

export interface UpdateProviderInput {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  isActive?: boolean;
  isDefault?: boolean;
}
```

### Encryption Service

```typescript
// src/core/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function getEncryptionKey(): Buffer {
  const key = process.env.EMAIL_ENCRYPTION_KEY;
  if (!key) {
    throw new ConfigurationError(
      "EMAIL_ENCRYPTION_KEY environment variable is required"
    );
  }
  // Key should be 32 bytes (256 bits) for AES-256
  return Buffer.from(key, "base64");
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  // Combine: iv + authTag + encrypted
  return Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, "base64"),
  ]).toString("base64");
}

export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const data = Buffer.from(ciphertext, "base64");

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

// Encrypt sensitive fields in config
export function encryptConfig(config: Record<string, unknown>): string {
  return encrypt(JSON.stringify(config));
}

// Decrypt config from DB
export function decryptConfig<T>(encrypted: string): T {
  return JSON.parse(decrypt(encrypted)) as T;
}
```

### Provider Service

```typescript
// src/service/provider.service.ts

export class ProviderService {
  constructor(private prisma: PrismaClient) {}

  async create(
    data: CreateProviderInput,
    userId?: string
  ): Promise<EmailProvider> {
    // Validate config based on type
    this.validateConfig(data.type, data.config);

    // Encrypt sensitive config
    const encryptedConfig = encryptConfig(data.config);

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await this.clearDefaults(data.organizationId);
    }

    return this.prisma.emailProvider.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        config: encryptedConfig,
        fromName: data.fromName,
        fromEmail: data.fromEmail,
        replyTo: data.replyTo,
        isDefault: data.isDefault ?? false,
        organizationId: data.organizationId,
        createdBy: userId,
      },
    });
  }

  async update(
    id: string,
    data: UpdateProviderInput,
    userId?: string
  ): Promise<EmailProvider> {
    const existing = await this.findById(id);
    if (!existing) throw new ProviderNotFoundError(id);

    // If updating config, validate and encrypt
    let encryptedConfig: string | undefined;
    if (data.config) {
      this.validateConfig(existing.type, data.config);
      encryptedConfig = encryptConfig(data.config);
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await this.clearDefaults(existing.organizationId);
    }

    return this.prisma.emailProvider.update({
      where: { id },
      data: {
        ...data,
        ...(encryptedConfig && { config: encryptedConfig }),
        updatedBy: userId,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.emailProvider.delete({ where: { id } });
  }

  async findById(id: string): Promise<EmailProvider | null> {
    return this.prisma.emailProvider.findUnique({ where: { id } });
  }

  async findDefault(organizationId?: string): Promise<EmailProvider | null> {
    return this.prisma.emailProvider.findFirst({
      where: {
        isDefault: true,
        isActive: true,
        organizationId: organizationId ?? null,
      },
    });
  }

  async list(organizationId?: string): Promise<EmailProvider[]> {
    return this.prisma.emailProvider.findMany({
      where: { organizationId: organizationId ?? null },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  }

  async testConnection(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    const provider = await this.findById(id);
    if (!provider) throw new ProviderNotFoundError(id);

    const instance = await EmailFactory.createFromDbRecord(provider);
    return instance.testConnection();
  }

  async setDefault(
    id: string,
    organizationId?: string
  ): Promise<EmailProvider> {
    await this.clearDefaults(organizationId);
    return this.prisma.emailProvider.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  private async clearDefaults(organizationId?: string | null): Promise<void> {
    await this.prisma.emailProvider.updateMany({
      where: {
        organizationId: organizationId ?? null,
        isDefault: true,
      },
      data: { isDefault: false },
    });
  }

  private validateConfig(
    type: ProviderType,
    config: Record<string, unknown>
  ): void {
    const requiredFields = PROVIDER_CONFIG_SCHEMA[type];
    for (const field of requiredFields) {
      if (!config[field]) {
        throw new ValidationError(`Missing required field: ${field}`, field);
      }
    }
  }
}

const PROVIDER_CONFIG_SCHEMA: Record<ProviderType, string[]> = {
  CONSOLE: [],
  SMTP: ["host", "port", "username", "password"],
  RESEND: ["apiKey"],
  MAILGUN: ["apiKey", "domain"],
  SENDGRID: ["apiKey"],
  SES: ["region", "accessKeyId", "secretAccessKey"],
};
```

### Factory (Database-Aware)

```typescript
// src/factory/email.factory.ts

export class EmailFactory {
  private static providerCache = new Map<string, EmailProviderInstance>();
  private static providerService: ProviderService;

  static initialize(prisma: PrismaClient): void {
    this.providerService = new ProviderService(prisma);
  }

  static async getProvider(
    providerId?: string
  ): Promise<EmailProviderInstance> {
    // Get from cache if exists
    if (providerId && this.providerCache.has(providerId)) {
      return this.providerCache.get(providerId)!;
    }

    // Get from database
    const dbProvider = providerId
      ? await this.providerService.findById(providerId)
      : await this.providerService.findDefault();

    if (!dbProvider) {
      // Fallback to console provider
      return new ConsoleProvider();
    }

    const instance = await this.createFromDbRecord(dbProvider);
    this.providerCache.set(dbProvider.id, instance);

    return instance;
  }

  static async createFromDbRecord(
    dbProvider: EmailProvider
  ): Promise<EmailProviderInstance> {
    const config = decryptConfig(dbProvider.config);

    switch (dbProvider.type) {
      case "CONSOLE":
        return new ConsoleProvider(dbProvider);
      case "SMTP":
        return new NodemailerProvider(dbProvider, config as SmtpConfig);
      case "RESEND":
        return new ResendProvider(dbProvider, config as ResendConfig);
      case "MAILGUN":
        return new MailgunProvider(dbProvider, config as MailgunConfig);
      case "SENDGRID":
        return new SendGridProvider(dbProvider, config as SendGridConfig);
      case "SES":
        return new SESProvider(dbProvider, config as SesConfig);
      default:
        throw new Error(`Unknown provider type: ${dbProvider.type}`);
    }
  }

  static invalidateCache(providerId?: string): void {
    if (providerId) {
      this.providerCache.delete(providerId);
    } else {
      this.providerCache.clear();
    }
  }
}
```

### Email Service

```typescript
// src/service/email.service.ts

export class EmailService {
  static async send(options: SendEmailOptions): Promise<SendResult> {
    const provider = await EmailFactory.getProvider(options.providerId);

    // Generate tracking ID if not provided
    const trackingId = options.trackingId || generateTrackingId();

    // Add tracking (unless disabled)
    let html = options.html;
    if (!options.disableTracking) {
      html = await addTracking(html, trackingId);
    }

    const result = await provider.send({
      ...options,
      html,
      trackingId,
    });

    // Update provider usage stats
    await updateProviderStats(provider.id);

    return result;
  }

  static async sendWith(
    providerId: string,
    options: SendEmailOptions
  ): Promise<SendResult> {
    return this.send({ ...options, providerId });
  }

  static async sendBulk(emails: SendEmailOptions[]): Promise<BulkSendResult> {
    const provider = await EmailFactory.getProvider();

    if (provider.sendBulk) {
      return provider.sendBulk(emails);
    }

    // Fallback: sequential sends
    const results = await Promise.allSettled(
      emails.map(email => this.send(email))
    );

    // Process results...
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

## API Routes

### Create Provider

```
POST /api/email-providers
Body: CreateProviderInput
Response: EmailProvider (without decrypted config)
```

### List Providers

```
GET /api/email-providers
Response: EmailProvider[]
```

### Get Provider

```
GET /api/email-providers/:id
Response: EmailProvider
```

### Update Provider

```
PUT /api/email-providers/:id
Body: UpdateProviderInput
Response: EmailProvider
```

### Delete Provider

```
DELETE /api/email-providers/:id
Response: { success: true }
```

### Test Provider Connection

```
POST /api/email-providers/:id/test
Response: { success: boolean, error?: string }
```

### Set Default Provider

```
POST /api/email-providers/:id/set-default
Response: EmailProvider
```

---

## Environment Variables

```bash
# Required for Phase 1
EMAIL_ENCRYPTION_KEY=base64-encoded-32-byte-key  # For encrypting provider credentials

# Generate a key:
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Definition of Done

- [ ] All user stories completed
- [ ] Prisma schema migrated
- [ ] Provider CRUD working
- [ ] API routes working
- [ ] Factory loads from DB
- [ ] Encryption working
- [ ] Console provider working
- [ ] `sendEmail()` works
- [ ] All tests passing
- [ ] Documentation updated

---

## Dependencies

```json
{
  "dependencies": {},
  "devDependencies": {},
  "peerDependencies": {
    "@prisma/client": "^5.0.0"
  }
}
```

---

## Estimated Effort

| Task                    | Hours               |
| ----------------------- | ------------------- |
| Package setup           | 2h                  |
| Core types              | 3h                  |
| Prisma schema           | 2h                  |
| Encryption service      | 3h                  |
| Provider service (CRUD) | 5h                  |
| API routes              | 4h                  |
| Factory (DB-aware)      | 3h                  |
| Console provider        | 2h                  |
| Email service           | 3h                  |
| Unit tests              | 5h                  |
| Documentation           | 2h                  |
| **Total**               | **~34h (4-5 days)** |
