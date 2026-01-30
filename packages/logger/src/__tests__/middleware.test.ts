import { describe, it, expect } from "vitest";
import {
  generateRequestId,
  getOrCreateRequestId,
  getCorrelationId,
  extractRequestContext,
  withRequestId,
  REQUEST_ID_HEADER,
  CORRELATION_ID_HEADER,
  runWithRequestContext,
  getRequestContext,
  getCurrentRequestId,
} from "../middleware.js";

describe("generateRequestId", () => {
  it("generates a UUID", () => {
    const id = generateRequestId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateRequestId()));
    expect(ids.size).toBe(100);
  });
});

describe("getOrCreateRequestId", () => {
  it("returns existing request ID from Headers", () => {
    const headers = new Headers();
    headers.set(REQUEST_ID_HEADER, "existing-id-123");

    expect(getOrCreateRequestId(headers)).toBe("existing-id-123");
  });

  it("generates new ID when header missing (Headers)", () => {
    const headers = new Headers();
    const id = getOrCreateRequestId(headers);

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("returns existing request ID from plain object", () => {
    const headers = { [REQUEST_ID_HEADER]: "plain-obj-id" };
    expect(getOrCreateRequestId(headers)).toBe("plain-obj-id");
  });

  it("handles array header values", () => {
    const headers = { [REQUEST_ID_HEADER]: ["first-id", "second-id"] };
    expect(getOrCreateRequestId(headers)).toBe("first-id");
  });

  it("generates new ID when header is undefined", () => {
    const headers = { [REQUEST_ID_HEADER]: undefined };
    const id = getOrCreateRequestId(headers);

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});

describe("getCorrelationId", () => {
  it("returns correlation ID from Headers", () => {
    const headers = new Headers();
    headers.set(CORRELATION_ID_HEADER, "corr-123");

    expect(getCorrelationId(headers)).toBe("corr-123");
  });

  it("returns undefined when missing", () => {
    const headers = new Headers();
    expect(getCorrelationId(headers)).toBeUndefined();
  });

  it("returns correlation ID from plain object", () => {
    const headers = { [CORRELATION_ID_HEADER]: "corr-456" };
    expect(getCorrelationId(headers)).toBe("corr-456");
  });
});

describe("extractRequestContext", () => {
  it("extracts full context from request", () => {
    const headers = new Headers();
    headers.set(REQUEST_ID_HEADER, "req-123");
    headers.set(CORRELATION_ID_HEADER, "corr-456");
    headers.set("user-agent", "TestAgent/1.0");
    headers.set("x-forwarded-for", "192.168.1.1, 10.0.0.1");

    const request = new Request("https://example.com/api/users?page=1", {
      method: "POST",
      headers,
    });

    const context = extractRequestContext(request);

    expect(context).toEqual({
      requestId: "req-123",
      correlationId: "corr-456",
      method: "POST",
      path: "/api/users",
      userAgent: "TestAgent/1.0",
      ip: "192.168.1.1",
    });
  });

  it("uses provided requestId over header", () => {
    const headers = new Headers();
    headers.set(REQUEST_ID_HEADER, "header-id");

    const request = new Request("https://example.com/test", { headers });
    const context = extractRequestContext(request, "provided-id");

    expect(context.requestId).toBe("provided-id");
  });

  it("generates requestId when missing", () => {
    const request = new Request("https://example.com/test");
    const context = extractRequestContext(request);

    expect(context.requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("uses x-real-ip as fallback", () => {
    const headers = new Headers();
    headers.set("x-real-ip", "10.0.0.5");

    const request = new Request("https://example.com/test", { headers });
    const context = extractRequestContext(request);

    expect(context.ip).toBe("10.0.0.5");
  });
});

describe("withRequestId", () => {
  it("returns requestId and response headers", () => {
    const headers = new Headers();
    headers.set(REQUEST_ID_HEADER, "existing-123");

    const request = new Request("https://example.com/test", { headers });
    const result = withRequestId(request);

    expect(result.requestId).toBe("existing-123");
    expect(result.headers.get(REQUEST_ID_HEADER)).toBe("existing-123");
  });

  it("generates requestId when missing", () => {
    const request = new Request("https://example.com/test");
    const result = withRequestId(request);

    expect(result.requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.headers.get(REQUEST_ID_HEADER)).toBe(result.requestId);
  });

  it("propagates correlation ID", () => {
    const headers = new Headers();
    headers.set(CORRELATION_ID_HEADER, "corr-789");

    const request = new Request("https://example.com/test", { headers });
    const result = withRequestId(request);

    expect(result.headers.get(CORRELATION_ID_HEADER)).toBe("corr-789");
  });
});

describe("AsyncLocalStorage context", () => {
  it("stores and retrieves request context", () => {
    const context = {
      requestId: "async-123",
      method: "GET",
      path: "/test",
    };

    runWithRequestContext(context, () => {
      const retrieved = getRequestContext();
      expect(retrieved).toEqual(context);
    });
  });

  it("returns undefined outside of context", () => {
    expect(getRequestContext()).toBeUndefined();
  });

  it("getCurrentRequestId returns requestId", () => {
    const context = {
      requestId: "current-456",
      method: "POST",
      path: "/api",
    };

    runWithRequestContext(context, () => {
      expect(getCurrentRequestId()).toBe("current-456");
    });
  });

  it("getCurrentRequestId returns undefined outside context", () => {
    expect(getCurrentRequestId()).toBeUndefined();
  });

  it("supports nested contexts", () => {
    const outerContext = { requestId: "outer", method: "GET", path: "/outer" };
    const innerContext = { requestId: "inner", method: "POST", path: "/inner" };

    runWithRequestContext(outerContext, () => {
      expect(getCurrentRequestId()).toBe("outer");

      runWithRequestContext(innerContext, () => {
        expect(getCurrentRequestId()).toBe("inner");
      });

      expect(getCurrentRequestId()).toBe("outer");
    });
  });
});
