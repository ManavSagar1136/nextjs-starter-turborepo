# Logging Package Plan - @buildbase/logger

## Overview

Add enterprise-grade logging to nextjs-starter-turborepo with:

- **Backend (BE):** Pino + New Relic integration
- **Frontend (FE):** Sentry for error tracking & performance

Apps define their configuration, packages provide the core logic.

---

## Current State

❌ No structured logging package exists
❌ Using raw `console.log/error` throughout codebase
❌ No error tracking (Sentry)
❌ No APM (New Relic)

---

## Architecture

```
packages/
├── logger/                     # Backend logging (Pino + New Relic)
│   ├── package.json
│   ├── src/
│   │   ├── index.ts           # Public exports
│   │   ├── types.ts           # Logger types
│   │   ├── config.ts          # Configuration
│   │   ├── pino.ts            # Pino logger setup
│   │   ├── newrelic.ts        # New Relic integration
│   │   ├── context.ts         # Request context (tracing)
│   │   └── middleware.ts      # Express/Next.js middleware
│   └── __tests__/
│
├── monitoring/                 # Frontend monitoring (Sentry)
│   ├── package.json
│   ├── src/
│   │   ├── index.ts           # Public exports
│   │   ├── types.ts           # Monitoring types
│   │   ├── sentry.ts          # Sentry client setup
│   │   ├── context.ts         # User/session context
│   │   ├── error-boundary.tsx # React error boundary
│   │   └── hooks.ts           # useSentry, useErrorBoundary
│   └── __tests__/
│
└── telemetry/                  # Shared telemetry (optional, future)
    └── ... (OpenTelemetry)

apps/
├── user/
│   ├── instrumentation.ts     # BE: New Relic agent init
│   ├── sentry.client.config.ts # FE: Sentry browser init
│   └── sentry.server.config.ts # BE: Sentry server init (optional)
│
└── public/
    ├── instrumentation.ts
    └── sentry.client.config.ts
```

---

## Package 1: @buildbase/logger (Backend)

### Purpose

Structured JSON logging with Pino, integrated with New Relic for APM and log forwarding.

### Features

- ✅ Pino for fast JSON logging
- ✅ Log levels (trace, debug, info, warn, error, fatal)
- ✅ Request ID / Correlation ID tracking
- ✅ New Relic log forwarding
- ✅ New Relic APM context linking
- ✅ Child loggers for modules
- ✅ Pretty printing in development
- ✅ Redaction of sensitive data

### Dependencies

```json
{
  "dependencies": {
    "pino": "^9.0.0",
    "pino-pretty": "^11.0.0"
  },
  "peerDependencies": {
    "newrelic": ">=11.0.0"
  },
  "peerDependenciesMeta": {
    "newrelic": { "optional": true }
  }
}
```

### Core Types

```typescript
// types.ts

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface LoggerConfig {
  level: LogLevel;
  serviceName: string;
  environment: string;

  // Pretty print in dev
  pretty?: boolean;

  // New Relic
  newRelic?: {
    enabled: boolean;
    licenseKey?: string;
    appName?: string;
  };

  // Redaction
  redact?: string[];
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  workspaceId?: string;
  traceId?: string;
  spanId?: string;
  [key: string]: unknown;
}

export interface Logger {
  trace(msg: string, context?: LogContext): void;
  debug(msg: string, context?: LogContext): void;
  info(msg: string, context?: LogContext): void;
  warn(msg: string, context?: LogContext): void;
  error(msg: string, error?: Error, context?: LogContext): void;
  fatal(msg: string, error?: Error, context?: LogContext): void;
  child(bindings: Record<string, unknown>): Logger;
}
```

### Usage in Apps

```typescript
// apps/user/src/lib/logger.ts
import { createLogger } from "@buildbase/logger";

export const logger = createLogger({
  serviceName: "user-app",
  level: process.env.LOG_LEVEL || "info",
  environment: process.env.NODE_ENV,
  newRelic: {
    enabled: process.env.NEW_RELIC_ENABLED === "true",
  },
  redact: ["password", "token", "secret", "authorization"],
});

// Usage in API route
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const log = logger.child({ requestId });

  log.info("Processing request", { path: "/api/users" });

  try {
    // ... logic
    log.info("Request completed successfully");
  } catch (error) {
    log.error("Request failed", error as Error);
    throw error;
  }
}
```

### New Relic Integration

```typescript
// apps/user/instrumentation.ts (Next.js 13+)
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // New Relic must be first
    await import("newrelic");

    // Initialize logger with New Relic context
    const { initializeNewRelic } = await import("@buildbase/logger");
    initializeNewRelic();
  }
}
```

---

## Package 2: @buildbase/monitoring (Frontend)

### Purpose

Frontend error tracking and performance monitoring with Sentry.

### Features

- ✅ Sentry SDK initialization
- ✅ Error boundary component
- ✅ User context tracking
- ✅ Performance tracing
- ✅ Session replay (optional)
- ✅ Source maps upload
- ✅ Release tracking

### Dependencies

```json
{
  "dependencies": {
    "@sentry/nextjs": "^8.0.0"
  },
  "peerDependencies": {
    "next": ">=14.0.0",
    "react": ">=18.0.0"
  }
}
```

### Core Types

```typescript
// types.ts

export interface MonitoringConfig {
  dsn: string;
  environment: string;
  release?: string;

  // Tracing
  tracesSampleRate?: number; // 0.0 - 1.0

  // Session replay
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;

  // Debug
  debug?: boolean;
}

export interface UserContext {
  id: string;
  email?: string;
  username?: string;
  workspaceId?: string;
}

export interface MonitoringClient {
  captureException(error: Error, context?: Record<string, unknown>): string;
  captureMessage(message: string, level?: "info" | "warning" | "error"): string;
  setUser(user: UserContext | null): void;
  setTag(key: string, value: string): void;
  addBreadcrumb(breadcrumb: {
    category: string;
    message: string;
    level?: string;
  }): void;
}
```

### Usage in Apps

```typescript
// apps/user/sentry.client.config.ts
import { initSentry } from '@buildbase/monitoring';

initSentry({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN!,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
});

// apps/user/src/app/layout.tsx
import { SentryErrorBoundary } from '@buildbase/monitoring';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SentryErrorBoundary fallback={<ErrorFallback />}>
          {children}
        </SentryErrorBoundary>
      </body>
    </html>
  );
}
```

### Error Boundary Component

```typescript
// packages/monitoring/src/error-boundary.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

export class SentryErrorBoundary extends Component<Props> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  render() {
    return (
      <Sentry.ErrorBoundary fallback={this.props.fallback}>
        {this.props.children}
      </Sentry.ErrorBoundary>
    );
  }
}
```

---

## Environment Variables

### Backend (@buildbase/logger + New Relic)

```bash
# Logging
LOG_LEVEL=info  # trace | debug | info | warn | error | fatal

# New Relic
NEW_RELIC_ENABLED=true
NEW_RELIC_LICENSE_KEY=xxx
NEW_RELIC_APP_NAME=cms-user-app
NEW_RELIC_LOG_ENABLED=true
NEW_RELIC_APPLICATION_LOGGING_FORWARDING_ENABLED=true
```

### Frontend (@buildbase/monitoring + Sentry)

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx  # For source maps
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

---

## Next.js Configuration

### next.config.ts (with Sentry)

```typescript
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  // Your config
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
```

### instrumentation.ts (New Relic)

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Import New Relic first
    await import("newrelic");
  }
}
```

---

## Enterprise Patterns

### 1. Correlation ID Middleware

```typescript
// packages/logger/src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export function withRequestId(handler: Function) {
  return async (req: NextRequest) => {
    const requestId = req.headers.get("x-request-id") || randomUUID();

    const response = await handler(req, { requestId });

    response.headers.set("x-request-id", requestId);
    return response;
  };
}
```

### 2. Structured Logging Format

```json
{
  "level": "info",
  "time": 1706123456789,
  "msg": "User logged in",
  "service": "user-app",
  "environment": "production",
  "requestId": "abc-123",
  "userId": "user_456",
  "workspaceId": "ws_789",
  "trace.id": "xyz",
  "span.id": "123"
}
```

### 3. Log Level by Environment

| Environment | Default Level | New Relic | Sentry          |
| ----------- | ------------- | --------- | --------------- |
| Development | debug         | Off       | Off             |
| Staging     | info          | On        | On (100%)       |
| Production  | info          | On        | On (10% traces) |

---

## Development Phases

### Phase 1: @buildbase/logger (3-4 days)

- [ ] Package setup
- [ ] Pino logger with pretty printing
- [ ] Log levels and child loggers
- [ ] Request context (requestId)
- [ ] Sensitive data redaction
- [ ] Unit tests

### Phase 2: New Relic Integration (2-3 days)

- [ ] New Relic agent setup guide
- [ ] Log forwarding to New Relic
- [ ] APM context linking
- [ ] Trace ID propagation
- [ ] Integration tests

### Phase 3: @buildbase/monitoring (3-4 days)

- [ ] Package setup
- [ ] Sentry SDK wrapper
- [ ] Error boundary component
- [ ] User context hooks
- [ ] Performance tracing
- [ ] Unit tests

### Phase 4: App Integration (2-3 days)

- [ ] Integrate in apps/user
- [ ] Integrate in apps/public
- [ ] Source maps setup
- [ ] Documentation
- [ ] E2E verification

**Total: ~10-14 days**

---

## Migration Guide

### Before (raw console)

```typescript
try {
  await createUser(data);
  console.log("User created successfully");
} catch (error) {
  console.error("Failed to create user:", error);
}
```

### After (@buildbase/logger)

```typescript
import { logger } from "@/lib/logger";

try {
  await createUser(data);
  logger.info("User created successfully", { userId: data.id });
} catch (error) {
  logger.error("Failed to create user", error as Error, { userData: data });
}
```

---

## Public API

### @buildbase/logger

```typescript
// Main exports
export { createLogger } from "./pino";
export { initializeNewRelic, getNewRelicContext } from "./newrelic";
export { withRequestId, getRequestId } from "./middleware";
export { LogContext } from "./context";

// Types
export type { Logger, LogLevel, LoggerConfig, LogContext };
```

### @buildbase/monitoring

```typescript
// Main exports
export { initSentry, getSentryClient } from "./sentry";
export { SentryErrorBoundary } from "./error-boundary";
export { useSentry, useErrorReporting } from "./hooks";
export { setUser, setContext, captureException } from "./context";

// Types
export type { MonitoringConfig, UserContext, MonitoringClient };
```

---

## Decision Points

1. **Pino vs Winston for BE?**
   - ✅ **Pino** - Faster, better for high-volume
   - Winston - More features, heavier

2. **Sentry vs LogRocket for FE?**
   - ✅ **Sentry** - Industry standard, better error tracking
   - LogRocket - Better session replay, more expensive

3. **OpenTelemetry?**
   - Not now - Add later for unified observability
   - New Relic + Sentry covers 90% of needs

4. **Separate packages or combined?**
   - ✅ **Separate** - FE and BE have different needs
   - Combined - Simpler but bloated bundles

---

## References

- [Pino Documentation](https://getpino.io/)
- [New Relic Node.js Agent](https://docs.newrelic.com/docs/apm/agents/nodejs-agent/)
- [New Relic Logs in Context](https://docs.newrelic.com/docs/logs/logs-context/configure-logs-context-nodejs/)
- [Sentry Next.js SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)

---

_Created: 2026-01-30_
_Author: MONA_
