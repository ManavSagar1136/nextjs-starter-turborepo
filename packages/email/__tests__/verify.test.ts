/**
 * @buildbase/email - QStash Verification Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { processQueuedEmail, verifyQStashSignature, createQStashMiddleware } from "../src/queue/verify.js";
import { EmailService } from "../src/service/email.service.js";

// Mock @buildbase/qstash
vi.mock("@buildbase/qstash/factory", () => ({
  createQStashFactory: vi.fn(() => ({
    receiver: {
      verifyNextRequest: vi.fn().mockResolvedValue({ valid: true }),
    },
    client: {
      publishJSON: vi.fn(),
    },
  })),
}));

// Mock EmailService
vi.mock("../src/service/email.service.js", () => ({
  EmailService: {
    sendDirect: vi.fn().mockResolvedValue({
      success: true,
      messageId: "msg_123",
      provider: "Test Provider",
      providerId: "test-provider",
      timestamp: new Date(),
      trackingId: "trk_123",
    }),
  },
}));

// Helper to create mock request
function createMockRequest(body: object, headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api/email/process", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "upstash-signature": "valid-signature",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("QStash Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("processQueuedEmail", () => {
    it("should process valid queued email", async () => {
      const payload = {
        email: {
          to: "user@example.com",
          subject: "Test",
          html: "<p>Hello</p>",
        },
        queuedAt: new Date().toISOString(),
      };

      const request = createMockRequest(payload);
      const result = await processQueuedEmail(request);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("msg_123");
      expect(result.provider).toBe("Test Provider");
    });

    it("should reject invalid signature", async () => {
      const { createQStashFactory } = await import("@buildbase/qstash/factory");
      (createQStashFactory as ReturnType<typeof vi.fn>).mockReturnValue({
        receiver: {
          verifyNextRequest: vi.fn().mockResolvedValue({
            valid: false,
            error: "Invalid signature",
          }),
        },
      });

      const request = createMockRequest({ email: {} });
      const result = await processQueuedEmail(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid signature");
    });

    it("should reject missing email in payload", async () => {
      const { createQStashFactory } = await import("@buildbase/qstash/factory");
      (createQStashFactory as ReturnType<typeof vi.fn>).mockReturnValue({
        receiver: {
          verifyNextRequest: vi.fn().mockResolvedValue({ valid: true }),
        },
      });

      const request = createMockRequest({ notEmail: {} });
      const result = await processQueuedEmail(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain("missing email");
    });

    it("should return error when send fails", async () => {
      const { createQStashFactory } = await import("@buildbase/qstash/factory");
      (createQStashFactory as ReturnType<typeof vi.fn>).mockReturnValue({
        receiver: {
          verifyNextRequest: vi.fn().mockResolvedValue({ valid: true }),
        },
      });

      (EmailService.sendDirect as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        errors: ["Provider connection failed"],
      });

      const payload = {
        email: {
          to: "user@example.com",
          subject: "Test",
          html: "<p>Hello</p>",
        },
      };

      const request = createMockRequest(payload);
      const result = await processQueuedEmail(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Provider connection failed");
    });

    it("should handle exceptions", async () => {
      const { createQStashFactory } = await import("@buildbase/qstash/factory");
      (createQStashFactory as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("QStash initialization failed");
      });

      const request = createMockRequest({ email: {} });
      const result = await processQueuedEmail(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe("QStash initialization failed");
    });

    it("should handle non-Error exceptions", async () => {
      const { createQStashFactory } = await import("@buildbase/qstash/factory");
      (createQStashFactory as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw "String error";
      });

      const request = createMockRequest({ email: {} });
      const result = await processQueuedEmail(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });
  });

  describe("verifyQStashSignature", () => {
    it("should return true for valid signature", async () => {
      const { createQStashFactory } = await import("@buildbase/qstash/factory");
      (createQStashFactory as ReturnType<typeof vi.fn>).mockReturnValue({
        receiver: {
          verifyNextRequest: vi.fn().mockResolvedValue({ valid: true }),
        },
      });

      const request = createMockRequest({});
      const isValid = await verifyQStashSignature(request);

      expect(isValid).toBe(true);
    });

    it("should return false for invalid signature", async () => {
      const { createQStashFactory } = await import("@buildbase/qstash/factory");
      (createQStashFactory as ReturnType<typeof vi.fn>).mockReturnValue({
        receiver: {
          verifyNextRequest: vi.fn().mockResolvedValue({ valid: false }),
        },
      });

      const request = createMockRequest({});
      const isValid = await verifyQStashSignature(request);

      expect(isValid).toBe(false);
    });

    it("should return false on exception", async () => {
      const { createQStashFactory } = await import("@buildbase/qstash/factory");
      (createQStashFactory as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("Verification error");
      });

      const request = createMockRequest({});
      const isValid = await verifyQStashSignature(request);

      expect(isValid).toBe(false);
    });
  });

  describe("createQStashMiddleware", () => {
    it("should create middleware that validates requests", async () => {
      const { createQStashFactory } = await import("@buildbase/qstash/factory");
      (createQStashFactory as ReturnType<typeof vi.fn>).mockReturnValue({
        receiver: {
          verifyNextRequest: vi.fn().mockResolvedValue({ valid: true }),
        },
      });

      const middleware = createQStashMiddleware();
      const request = createMockRequest({});

      const result = await middleware(request);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return error message for invalid requests", async () => {
      const { createQStashFactory } = await import("@buildbase/qstash/factory");
      (createQStashFactory as ReturnType<typeof vi.fn>).mockReturnValue({
        receiver: {
          verifyNextRequest: vi.fn().mockResolvedValue({
            valid: false,
            error: "Signature mismatch",
          }),
        },
      });

      const middleware = createQStashMiddleware();
      const request = createMockRequest({});

      const result = await middleware(request);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Signature mismatch");
    });

    it("should handle exceptions in middleware", async () => {
      const { createQStashFactory } = await import("@buildbase/qstash/factory");
      (createQStashFactory as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("Middleware error");
      });

      const middleware = createQStashMiddleware();
      const request = createMockRequest({});

      const result = await middleware(request);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Middleware error");
    });

    it("should handle non-Error exceptions in middleware", async () => {
      const { createQStashFactory } = await import("@buildbase/qstash/factory");
      (createQStashFactory as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw "String error";
      });

      const middleware = createQStashMiddleware();
      const request = createMockRequest({});

      const result = await middleware(request);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Verification failed");
    });
  });
});
