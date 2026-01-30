# @buildbase/logger

Structured logging with [Pino](https://github.com/pinojs/pino) for backend services. Fast, JSON-native, with built-in redaction for sensitive data.

## Features

- ⚡ **Fast** - Pino is ~5x faster than alternatives
- 🔒 **Secure** - Built-in redaction for passwords, tokens, and sensitive fields
- 📊 **Structured** - JSON output ready for log aggregation (New Relic, Datadog, etc.)
- 🎨 **Pretty print** - Colorized output in development
- 👶 **Child loggers** - Add request context without pollution
- 📝 **TypeScript** - Full type safety

## Installation

```bash
yarn add @buildbase/logger
```

## Usage

### Basic Logger

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

// Errors
logger.error(new Error("Something broke"), "Operation failed");
```

### Child Loggers

Add request-specific context:

```typescript
const requestLogger = logger.child({
  requestId: "abc-123",
  userId: "user-456",
});

requestLogger.info("Processing request");
// Output includes requestId and userId in every log
```

### Configuration

```typescript
interface LoggerConfig {
  serviceName: string; // Required: identifies the service
  level?: LogLevel; // 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  redact?: string[]; // Additional fields to redact
  prettyPrint?: boolean; // Auto-enabled in development
  base?: Record<string, unknown>; // Base context for all logs
}
```

### Default Redacted Fields

These fields are automatically redacted:

- `password`
- `token`, `accessToken`, `refreshToken`
- `authorization`
- `apiKey`, `secret`
- `creditCard`, `ssn`
- `req.headers.authorization`
- `req.headers.cookie`
- `res.headers.set-cookie`

Add custom fields via the `redact` option.

### Log Levels

| Level   | When to use                       |
| ------- | --------------------------------- |
| `trace` | Fine-grained debugging            |
| `debug` | Debugging information             |
| `info`  | General information (default)     |
| `warn`  | Something unexpected, but handled |
| `error` | Error conditions                  |
| `fatal` | System is unusable                |

### Environment Variables

```bash
LOG_LEVEL=info          # Set log level
NODE_ENV=development    # Enables pretty print
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

## API Reference

### `createLogger(config: LoggerConfig): Logger`

Creates a new logger instance.

### `createChildLogger(parent: Logger, bindings: LogContext): Logger`

Creates a child logger with additional context.

### `DEFAULT_REDACT_PATHS`

Array of default paths that are redacted.

## Next Steps

- Phase 2: New Relic integration for log forwarding
- Phase 3: Request ID tracking middleware
