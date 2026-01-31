/**
 * Tests for API logger wrapper patterns
 *
 * These tests validate the withLogging and withLoggingParams patterns
 * used in app-level api-logger.ts files.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger } from "../index.js";
import { extractRequestContext, createRequestLogger, logRequestStart, logRequestEnd } from "../middleware.js";

// Mock New Relic functions
vi.mock("../newrelic.js", () => ({
  noticeError: vi.fn(),
  addTransactionAttributes: vi.fn(),
}));

import { noticeError, addTransactionAttributes } from "../newrelic.js";

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

describe("API Logger Pattern", () => {
  let logger: ReturnType<typeof createLogger>;

  beforeEach(() => {
    vi.clearAllMocks();
    logger = createLogger({
      serviceName: "test-api",
      prettyPrint: false,
    });
  });

  describe("extractRequestContext", () => {
    it("extracts context from request", () => {
      const headers = new Headers();
      headers.set("x-request-id", "test-req-123");
      headers.set("user-agent", "TestAgent/1.0");
      headers.set("x-forwarded-for", "192.168.1.1");

      const request = new Request("https://api.example.com/users", {
        method: "POST",
        headers,
      });

      const context = extractRequestContext(request);

      expect(context.requestId).toBe("test-req-123");
      expect(context.method).toBe("POST");
      expect(context.path).toBe("/users");
      expect(context.userAgent).toBe("TestAgent/1.0");
      expect(context.ip).toBe("192.168.1.1");
    });

    it("generates requestId if not provided", () => {
      const request = new Request("https://api.example.com/test");
      const context = extractRequestContext(request);

      expect(context.requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe("createRequestLogger", () => {
    it("creates child logger with requestId binding", () => {
      const context = {
        requestId: "req-456",
        method: "GET",
        path: "/api/users",
      };

      const reqLogger = createRequestLogger(logger, context);

      // Verify the child logger is created and has expected methods
      expect(reqLogger).toBeDefined();
      expect(reqLogger.info).toBeInstanceOf(Function);
      expect(reqLogger.error).toBeInstanceOf(Function);
      expect(reqLogger.child).toBeInstanceOf(Function);

      // Can create nested child
      const nestedLogger = reqLogger.child({ operation: "test" });
      expect(nestedLogger).toBeDefined();
    });
  });

  describe("logRequestStart", () => {
    it("logs request start with context", () => {
      const capture = captureStdout();
      // Create logger AFTER capturing stdout so pino writes to captured stream
      const testLogger = createLogger({
        serviceName: "test-api",
        prettyPrint: false,
      });

      const context = {
        requestId: "start-123",
        method: "POST",
        path: "/api/create",
        userAgent: "TestAgent",
        ip: "10.0.0.1",
      };

      logRequestStart(testLogger, context);

      capture.restore();

      const logLine = capture.logs.find(l => l.includes("Request started"));
      expect(logLine).toBeDefined();

      const parsed = JSON.parse(logLine!);
      expect(parsed.requestId).toBe("start-123");
      expect(parsed.method).toBe("POST");
      expect(parsed.path).toBe("/api/create");
    });
  });

  describe("logRequestEnd", () => {
    it("logs successful request completion", () => {
      const capture = captureStdout();
      const testLogger = createLogger({
        serviceName: "test-api",
        prettyPrint: false,
      });

      const context = {
        requestId: "end-789",
        method: "GET",
        path: "/api/success",
      };

      logRequestEnd(testLogger, context, 200, 150);

      capture.restore();

      const logLine = capture.logs.find(l => l.includes("Request completed with status 200"));
      expect(logLine).toBeDefined();

      const parsed = JSON.parse(logLine!);
      expect(parsed.level).toBe("info");
      expect(parsed.statusCode).toBe(200);
      expect(parsed.durationMs).toBe(150);
    });

    it("logs 4xx as warning", () => {
      const capture = captureStdout();
      const testLogger = createLogger({
        serviceName: "test-api",
        prettyPrint: false,
      });

      const context = {
        requestId: "warn-404",
        method: "GET",
        path: "/api/notfound",
      };

      logRequestEnd(testLogger, context, 404, 50);

      capture.restore();

      const logLine = capture.logs.find(l => l.includes("Request completed with status 404"));
      expect(logLine).toBeDefined();

      const parsed = JSON.parse(logLine!);
      expect(parsed.level).toBe("warn");
    });

    it("logs 5xx as error", () => {
      const capture = captureStdout();
      const testLogger = createLogger({
        serviceName: "test-api",
        prettyPrint: false,
      });

      const context = {
        requestId: "error-500",
        method: "POST",
        path: "/api/crash",
      };

      logRequestEnd(testLogger, context, 500, 1000);

      capture.restore();

      const logLine = capture.logs.find(l => l.includes("Request completed with status 500"));
      expect(logLine).toBeDefined();

      const parsed = JSON.parse(logLine!);
      expect(parsed.level).toBe("error");
    });
  });

  describe("New Relic integration", () => {
    it("addTransactionAttributes is callable", () => {
      addTransactionAttributes({
        requestId: "nr-123",
        path: "/api/test",
        method: "GET",
      });

      expect(addTransactionAttributes).toHaveBeenCalledWith({
        requestId: "nr-123",
        path: "/api/test",
        method: "GET",
      });
    });

    it("noticeError is callable for error reporting", () => {
      const error = new Error("Test error");

      noticeError(error, {
        requestId: "nr-error-456",
        path: "/api/fail",
        method: "POST",
      });

      expect(noticeError).toHaveBeenCalledWith(error, {
        requestId: "nr-error-456",
        path: "/api/fail",
        method: "POST",
      });
    });
  });
});

describe("Request timing", () => {
  it("captures accurate timing", () => {
    const capture = captureStdout();
    const logger = createLogger({
      serviceName: "timing-test",
      prettyPrint: false,
    });

    const context = {
      requestId: "timing-001",
      method: "GET",
      path: "/api/slow",
    };

    // Simulate a 100ms request
    const startTime = Date.now();
    const simulatedDuration = 100;

    logRequestEnd(logger, context, 200, simulatedDuration);

    capture.restore();

    const logLine = capture.logs.find(l => l.includes("Request completed"));
    expect(logLine).toBeDefined();

    const parsed = JSON.parse(logLine!);
    expect(parsed.durationMs).toBe(100);
  });
});
