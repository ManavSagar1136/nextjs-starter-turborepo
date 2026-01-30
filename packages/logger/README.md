# @buildbase/logger

Structured logging with [Pino](https://github.com/pinojs/pino) for backend services. Fast, JSON-native, with built-in redaction and New Relic integration.

## Features

- ⚡ **Fast** - Pino is ~5x faster than alternatives
- 🔒 **Secure** - Built-in redaction for passwords, tokens, and sensitive fields
- 📊 **Structured** - JSON output ready for log aggregation
- 🎨 **Pretty print** - Colorized output in development
- 👶 **Child loggers** - Add request context without pollution
- 🔗 **New Relic** - Automatic log correlation with traces
- 🆔 **Request tracking** - Built-in request ID middleware
- 📝 **TypeScript** - Full type safety

## Installation

```bash
yarn add @buildbase/logger
```

## Basic Usage

```typescript
import { createLogger } from "@buildbase/logger";

const logger = createLogger({
  serviceName: "user-app",
  level: "info",
  redact: ["password", "token"],
});

// Simple message
logger.info("Application started");

// With context (Pino style - context first)
logger.info({ userId: "123", action: "login" }, "User logged in");

// Or context second
logger.info("User logged in", { userId: "123" });

// Errors with stack traces
logger.error(new Error("Something broke"), "Operation failed");
```

## New Relic Integration

### Enable Log Correlation

```typescript
import { createLogger } from "@buildbase/logger";

const logger = createLogger({
  serviceName: "user-app",
  newRelic: { enabled: true },
});

// Logs will include trace.id and span.id for correlation
logger.info("This log will link to APM traces");
```

### New Relic Utilities

```typescript
import {
  isNewRelicEnabled,
  addTransactionAttribute,
  noticeError,
  recordCustomEvent,
  startBackgroundTransaction,
  generateNewRelicConfig,
} from "@buildbase/logger/newrelic";

// Check if New Relic is enabled
if (isNewRelicEnabled()) {
  // Add custom attribute to current transaction
  addTransactionAttribute("userId", "123");

  // Record custom event
  recordCustomEvent("UserSignup", {
    plan: "pro",
    source: "web",
  });
}

// Report errors to New Relic
try {
  await riskyOperation();
} catch (error) {
  noticeError(error, { operation: "riskyOperation" });
  throw error;
}

// Background transactions for cron jobs
await startBackgroundTransaction("daily-cleanup", "cron", async () => {
  await cleanupOldRecords();
});
```

### Generate newrelic.js Config

```typescript
import { generateNewRelicConfig } from "@buildbase/logger/newrelic";

// Generate config for newrelic.js file
const config = generateNewRelicConfig({
  appName: "my-app",
  licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
  distributedTracing: true,
  logForwarding: true,
});
```

## Request ID Tracking

### Next.js Middleware

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import { withRequestId } from "@buildbase/logger/middleware";

export function middleware(request: NextRequest) {
  const { requestId, headers } = withRequestId(request);

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Add request ID to response headers
  headers.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}
```

### Request-Scoped Logging

```typescript
import { createLogger } from "@buildbase/logger";
import {
  extractRequestContext,
  createRequestLogger,
  runWithRequestContext,
  getCurrentRequestId,
} from "@buildbase/logger/middleware";

const logger = createLogger({ serviceName: "api" });

export async function handleRequest(request: Request) {
  const context = extractRequestContext(request);
  const reqLogger = createRequestLogger(logger, context);

  // Use AsyncLocalStorage for deep access
  return runWithRequestContext(context, async () => {
    reqLogger.info("Request started");

    // Anywhere in your code:
    const requestId = getCurrentRequestId();

    await processRequest();

    reqLogger.info("Request completed");
  });
}
```

## Child Loggers

Add request-specific context:

```typescript
const requestLogger = logger.child({
  requestId: "abc-123",
  userId: "user-456",
});

requestLogger.info("Processing request");
// Output includes requestId and userId in every log
```

## Configuration

```typescript
interface LoggerConfig {
  serviceName: string; // Required: identifies the service
  level?: LogLevel; // 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  redact?: string[]; // Additional fields to redact
  prettyPrint?: boolean; // Auto-enabled in development
  base?: Record<string, unknown>; // Base context for all logs
  newRelic?: {
    enabled?: boolean; // Enable New Relic log correlation
    appName?: string; // Override app name
  };
}
```

## Default Redacted Fields

These fields are automatically redacted:

- `password`
- `token`, `accessToken`, `refreshToken`
- `authorization`
- `apiKey`, `secret`
- `creditCard`, `ssn`
- `req.headers.authorization`
- `req.headers.cookie`
- `res.headers.set-cookie`

## Environment Variables

```bash
# Logging
LOG_LEVEL=info              # Set log level
NODE_ENV=development        # Enables pretty print

# New Relic
NEW_RELIC_ENABLED=true
NEW_RELIC_LICENSE_KEY=xxx
NEW_RELIC_APP_NAME=my-app
```

## Output Examples

### Development (pretty print)

```
[16:30:45] INFO (user-app): User logged in
    userId: "123"
    action: "login"
```

### Production (JSON)

```json
{
  "level": "info",
  "time": "2026-01-30T10:30:45.123Z",
  "service": "user-app",
  "userId": "123",
  "action": "login",
  "msg": "User logged in"
}
```

### With New Relic (JSON)

```json
{
  "level": "info",
  "time": "2026-01-30T10:30:45.123Z",
  "service": "user-app",
  "trace.id": "abc123",
  "span.id": "def456",
  "userId": "123",
  "msg": "User logged in"
}
```

## API Reference

### Main Exports (`@buildbase/logger`)

| Export                                | Description                     |
| ------------------------------------- | ------------------------------- |
| `createLogger(config)`                | Create a new logger instance    |
| `createChildLogger(parent, bindings)` | Create a child logger           |
| `DEFAULT_REDACT_PATHS`                | Array of default redacted paths |

### Middleware Exports (`@buildbase/logger/middleware`)

| Export                                 | Description                          |
| -------------------------------------- | ------------------------------------ |
| `withRequestId(request)`               | Add request ID to request/response   |
| `extractRequestContext(request)`       | Extract logging context from request |
| `createRequestLogger(logger, context)` | Create request-scoped logger         |
| `runWithRequestContext(context, fn)`   | Run with AsyncLocalStorage context   |
| `getRequestContext()`                  | Get current request context          |
| `getCurrentRequestId()`                | Get current request ID               |
| `REQUEST_ID_HEADER`                    | Header name: `x-request-id`          |
| `CORRELATION_ID_HEADER`                | Header name: `x-correlation-id`      |

### New Relic Exports (`@buildbase/logger/newrelic`)

| Export                                        | Description                        |
| --------------------------------------------- | ---------------------------------- |
| `isNewRelicEnabled()`                         | Check if New Relic is configured   |
| `getLinkingMetadata()`                        | Get trace/span IDs for correlation |
| `addTransactionAttribute(key, value)`         | Add custom attribute               |
| `addTransactionAttributes(attrs)`             | Add multiple attributes            |
| `noticeError(error, attrs?)`                  | Report error to New Relic          |
| `recordCustomEvent(type, attrs)`              | Record custom event                |
| `setTransactionName(name)`                    | Set transaction name               |
| `startBackgroundTransaction(name, group, fn)` | Wrap background job                |
| `generateNewRelicConfig(config)`              | Generate newrelic.js config        |
