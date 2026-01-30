import { describe, it, expect } from "vitest";
import { createLogger, createChildLogger, DEFAULT_REDACT_PATHS } from "../index.js";

// Capture stdout to verify log output
const captureStdout = () => {
  const logs: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);

  process.stdout.write = ((chunk: string | Uint8Array) => {
    if (typeof chunk === "string") {
      logs.push(chunk);
    } else {
      logs.push(chunk.toString());
    }
    return true;
  }) as typeof process.stdout.write;

  return {
    logs,
    restore: () => {
      process.stdout.write = originalWrite;
    },
  };
};

describe("createLogger", () => {
  it("creates a logger with required config", () => {
    const logger = createLogger({
      serviceName: "test-service",
      prettyPrint: false,
    });

    expect(logger).toBeDefined();
    expect(logger.info).toBeInstanceOf(Function);
    expect(logger.error).toBeInstanceOf(Function);
    expect(logger.warn).toBeInstanceOf(Function);
    expect(logger.debug).toBeInstanceOf(Function);
    expect(logger.trace).toBeInstanceOf(Function);
    expect(logger.fatal).toBeInstanceOf(Function);
    expect(logger.child).toBeInstanceOf(Function);
  });

  it("logs messages with correct level", () => {
    const capture = captureStdout();

    const logger = createLogger({
      serviceName: "test-service",
      level: "info",
      prettyPrint: false,
    });

    logger.info("Hello world");

    capture.restore();

    const logLine = capture.logs.find(l => l.includes("Hello world"));
    expect(logLine).toBeDefined();

    const parsed = JSON.parse(logLine!);
    expect(parsed.level).toBe("info");
    expect(parsed.msg).toBe("Hello world");
    expect(parsed.service).toBe("test-service");
  });

  it("logs with context object", () => {
    const capture = captureStdout();

    const logger = createLogger({
      serviceName: "test-service",
      prettyPrint: false,
    });

    logger.info({ userId: "123", action: "login" }, "User action");

    capture.restore();

    const logLine = capture.logs.find(l => l.includes("User action"));
    expect(logLine).toBeDefined();

    const parsed = JSON.parse(logLine!);
    expect(parsed.userId).toBe("123");
    expect(parsed.action).toBe("login");
  });

  it("logs with context as second argument", () => {
    const capture = captureStdout();

    const logger = createLogger({
      serviceName: "test-service",
      prettyPrint: false,
    });

    logger.info("User action", { userId: "456" });

    capture.restore();

    const logLine = capture.logs.find(l => l.includes("User action"));
    expect(logLine).toBeDefined();

    const parsed = JSON.parse(logLine!);
    expect(parsed.userId).toBe("456");
  });

  it("logs errors with stack trace", () => {
    const capture = captureStdout();

    const logger = createLogger({
      serviceName: "test-service",
      prettyPrint: false,
    });

    const error = new Error("Something went wrong");
    logger.error(error, "Operation failed");

    capture.restore();

    const logLine = capture.logs.find(l => l.includes("Operation failed"));
    expect(logLine).toBeDefined();

    const parsed = JSON.parse(logLine!);
    expect(parsed.level).toBe("error");
    expect(parsed.err).toBeDefined();
    expect(parsed.err.message).toBe("Something went wrong");
    expect(parsed.err.stack).toBeDefined();
  });

  it("respects log level filtering", () => {
    const capture = captureStdout();

    const logger = createLogger({
      serviceName: "test-service",
      level: "warn",
      prettyPrint: false,
    });

    logger.info("This should not appear");
    logger.warn("This should appear");

    capture.restore();

    expect(capture.logs.some(l => l.includes("should not appear"))).toBe(false);
    expect(capture.logs.some(l => l.includes("should appear"))).toBe(true);
  });
});

describe("redaction", () => {
  it("redacts default sensitive fields", () => {
    const capture = captureStdout();

    const logger = createLogger({
      serviceName: "test-service",
      prettyPrint: false,
    });

    logger.info(
      {
        password: "secret123",
        token: "jwt-token",
        username: "john",
      },
      "User data"
    );

    capture.restore();

    const logLine = capture.logs.find(l => l.includes("User data"));
    expect(logLine).toBeDefined();

    const parsed = JSON.parse(logLine!);
    expect(parsed.password).toBe("[Redacted]");
    expect(parsed.token).toBe("[Redacted]");
    expect(parsed.username).toBe("john"); // Not redacted
  });

  it("redacts custom fields", () => {
    const capture = captureStdout();

    const logger = createLogger({
      serviceName: "test-service",
      redact: ["customSecret", "internalId"],
      prettyPrint: false,
    });

    logger.info(
      {
        customSecret: "my-secret",
        internalId: "internal-123",
        publicField: "visible",
      },
      "Custom redaction"
    );

    capture.restore();

    const logLine = capture.logs.find(l => l.includes("Custom redaction"));
    expect(logLine).toBeDefined();

    const parsed = JSON.parse(logLine!);
    expect(parsed.customSecret).toBe("[Redacted]");
    expect(parsed.internalId).toBe("[Redacted]");
    expect(parsed.publicField).toBe("visible");
  });

  it("redacts nested paths", () => {
    const capture = captureStdout();

    const logger = createLogger({
      serviceName: "test-service",
      prettyPrint: false,
    });

    logger.info(
      {
        req: {
          headers: {
            authorization: "Bearer secret-token",
            "content-type": "application/json",
          },
        },
      },
      "Request logged"
    );

    capture.restore();

    const logLine = capture.logs.find(l => l.includes("Request logged"));
    expect(logLine).toBeDefined();

    const parsed = JSON.parse(logLine!);
    expect(parsed.req.headers.authorization).toBe("[Redacted]");
    expect(parsed.req.headers["content-type"]).toBe("application/json");
  });

  it("exports DEFAULT_REDACT_PATHS", () => {
    expect(DEFAULT_REDACT_PATHS).toContain("password");
    expect(DEFAULT_REDACT_PATHS).toContain("token");
    expect(DEFAULT_REDACT_PATHS).toContain("authorization");
    expect(DEFAULT_REDACT_PATHS).toContain("apiKey");
    expect(DEFAULT_REDACT_PATHS).toContain("req.headers.authorization");
  });
});

describe("child loggers", () => {
  it("creates child logger with bindings", () => {
    const capture = captureStdout();

    const logger = createLogger({
      serviceName: "test-service",
      prettyPrint: false,
    });

    const childLogger = logger.child({ requestId: "req-123" });
    childLogger.info("Child log");

    capture.restore();

    const logLine = capture.logs.find(l => l.includes("Child log"));
    expect(logLine).toBeDefined();

    const parsed = JSON.parse(logLine!);
    expect(parsed.requestId).toBe("req-123");
    expect(parsed.service).toBe("test-service");
  });

  it("child logger inherits parent config", () => {
    const capture = captureStdout();

    const logger = createLogger({
      serviceName: "test-service",
      prettyPrint: false,
    });

    const childLogger = logger.child({ requestId: "req-456" });

    // Should still redact sensitive data
    childLogger.info({ password: "secret" }, "With password");

    capture.restore();

    const logLine = capture.logs.find(l => l.includes("With password"));
    expect(logLine).toBeDefined();

    const parsed = JSON.parse(logLine!);
    expect(parsed.password).toBe("[Redacted]");
    expect(parsed.requestId).toBe("req-456");
  });

  it("createChildLogger helper works", () => {
    const capture = captureStdout();

    const logger = createLogger({
      serviceName: "test-service",
      prettyPrint: false,
    });

    const childLogger = createChildLogger(logger, { userId: "user-789" });
    childLogger.info("Helper child");

    capture.restore();

    const logLine = capture.logs.find(l => l.includes("Helper child"));
    expect(logLine).toBeDefined();

    const parsed = JSON.parse(logLine!);
    expect(parsed.userId).toBe("user-789");
  });
});

describe("isLevelEnabled", () => {
  it("returns true for enabled levels", () => {
    const logger = createLogger({
      serviceName: "test-service",
      level: "info",
      prettyPrint: false,
    });

    expect(logger.isLevelEnabled("info")).toBe(true);
    expect(logger.isLevelEnabled("warn")).toBe(true);
    expect(logger.isLevelEnabled("error")).toBe(true);
  });

  it("returns false for disabled levels", () => {
    const logger = createLogger({
      serviceName: "test-service",
      level: "warn",
      prettyPrint: false,
    });

    expect(logger.isLevelEnabled("trace")).toBe(false);
    expect(logger.isLevelEnabled("debug")).toBe(false);
    expect(logger.isLevelEnabled("info")).toBe(false);
  });
});

describe("base context", () => {
  it("includes base context in all logs", () => {
    const capture = captureStdout();

    const logger = createLogger({
      serviceName: "test-service",
      base: { environment: "test", version: "1.0.0" },
      prettyPrint: false,
    });

    logger.info("With base context");

    capture.restore();

    const logLine = capture.logs.find(l => l.includes("With base context"));
    expect(logLine).toBeDefined();

    const parsed = JSON.parse(logLine!);
    expect(parsed.environment).toBe("test");
    expect(parsed.version).toBe("1.0.0");
    expect(parsed.service).toBe("test-service");
  });
});
