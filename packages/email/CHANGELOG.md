# Changelog

All notable changes to the `@buildbase/email` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-01-30

### Added

#### Phase 1: Core Foundation

- `EmailFactory` for provider instantiation
- `EmailService` static methods for sending
- `sendEmail()` convenience function
- Core types (`SendEmailOptions`, `SendResult`, etc.)
- Custom error classes (`EmailError`, `ProviderError`, `ValidationError`)
- Configuration encryption/decryption utilities
- `ConsoleProvider` for development/testing

#### Phase 2: Providers

- `NodemailerProvider` for SMTP servers
- `ResendProvider` for Resend.com
- `MailgunProvider` for Mailgun
- `SendGridProvider` for SendGrid
- `SesProvider` for AWS SES
- `ProviderService` for database CRUD
- Provider connection testing

#### Phase 3: Templates

- `TemplateService` for template management
- Handlebars-based template rendering
- Variable extraction and validation
- Template preview functionality
- `sendTemplate()` and `sendTemplateById()` methods

#### Phase 4: Queue

- `EmailQueue` service for async sending
- `delay()` for delayed sends (string or ms)
- `schedule()` for specific time sends
- `enqueueBulk()` for batch queuing
- QStash integration
- Signature verification for webhooks
- `processQueuedEmail()` endpoint helper

#### Phase 5: Tracking

- Open tracking via 1x1 pixel
- Click tracking via link rewriting
- `TrackingService` for recording events
- `getMetrics()` for email analytics
- Tracking enabled by default
- `disableTracking` option per email

#### Phase 6: Polish

- Comprehensive README documentation
- Input validation utilities
- Health check functionality
- `sendTestEmail()` for verification
- Additional error classes (`RateLimitError`, `NotInitializedError`)
- Error codes for programmatic handling

### Database Models

- `EmailProvider` - Provider configuration
- `EmailTemplate` - Email templates
- `EmailEvent` - Tracking events
- `EmailPreference` - Unsubscribe preferences

### Compliance Features

- `List-Unsubscribe` header
- `List-Unsubscribe-Post` for one-click
- `UnsubscribeService` for preference management
- Category-based unsubscribe (marketing, newsletter, etc.)

---

## Migration Guide

### From v0.0.x

This is the initial release. No migration needed.

### Setting Up

1. Install the package and dependencies
2. Run Prisma migrations for new models
3. Call `EmailService.initialize(prisma)` at app startup
4. Add at least one provider via Admin UI or seed script
5. Configure environment variables

### Environment Variables

```bash
APP_URL=https://yourapp.com
QSTASH_TOKEN=xxxxx  # Optional for queue
EMAIL_ENCRYPTION_KEY=your-32-byte-key
```

---

[Unreleased]: https://github.com/buildbase-app/nextjs-starter-turborepo/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/buildbase-app/nextjs-starter-turborepo/releases/tag/v0.1.0
