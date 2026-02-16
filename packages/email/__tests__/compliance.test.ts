/**
 * @buildbase/email - Compliance Tests
 * Tests for compliance headers and unsubscribe functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @buildbase/env to allow test environment variable control
vi.mock("@buildbase/env", () => {
  return {
    env: new Proxy({} as Record<string, string | undefined>, {
      get(_target, prop: string) {
        return process.env[prop];
      },
    }),
    isDevelopment: () => process.env.NODE_ENV === "development",
    isProduction: () => process.env.NODE_ENV === "production",
    isTest: () => process.env.NODE_ENV === "test",
  };
});

import {
  generateMessageId,
  addComplianceHeaders,
  generateUnsubscribeUrl,
  generateOneClickUnsubscribeUrl,
} from "../src/compliance/headers.js";
import { generateUnsubscribeToken } from "../src/compliance/unsubscribe.js";

describe("Compliance Headers", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_PUBLIC_APP_URL", "https://app.example.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("generateMessageId", () => {
    it("should generate unique message IDs", () => {
      const id1 = generateMessageId();
      const id2 = generateMessageId();

      expect(id1).not.toBe(id2);
    });

    it("should include domain from APP_URL", () => {
      const id = generateMessageId();

      expect(id).toContain("@app.example.com");
    });

    it("should use fallback domain when APP_URL is invalid", () => {
      vi.stubEnv("NEXT_PUBLIC_PUBLIC_APP_URL", "not-a-valid-url");
      const id = generateMessageId();

      expect(id).toContain("@example.com");
    });

    it("should contain timestamp", () => {
      const before = Date.now();
      const id = generateMessageId();
      const after = Date.now();

      // Extract timestamp from message ID (format: uuid.timestamp@domain)
      const match = id.match(/\.(\d+)@/);
      expect(match).not.toBeNull();

      const timestamp = parseInt(match![1]!, 10);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("addComplianceHeaders", () => {
    it("should add required compliance headers", () => {
      const headers = addComplianceHeaders(
        {},
        {
          unsubscribeUrl: "https://app.com/unsub/token123",
          trackingId: "trk_123",
        }
      );

      expect(headers["Message-ID"]).toBeDefined();
      expect(headers["List-Unsubscribe"]).toBe("<https://app.com/unsub/token123>");
      expect(headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
      expect(headers["X-Entity-Ref-ID"]).toBe("trk_123");
    });

    it("should preserve existing headers", () => {
      const existingHeaders = {
        "X-Custom": "value",
        "X-Priority": "high",
      };

      const headers = addComplianceHeaders(existingHeaders, {
        unsubscribeUrl: "https://app.com/unsub/token",
        trackingId: "trk_456",
      });

      expect(headers["X-Custom"]).toBe("value");
      expect(headers["X-Priority"]).toBe("high");
    });

    it("should add Feedback-ID when campaignId is provided", () => {
      const headers = addComplianceHeaders(
        {},
        {
          unsubscribeUrl: "https://app.com/unsub/token",
          trackingId: "trk_123",
          campaignId: "campaign_456",
        }
      );

      expect(headers["Feedback-ID"]).toBeDefined();
      expect(headers["Feedback-ID"]).toContain("campaign_456");
      expect(headers["Feedback-ID"]).toContain("trk_123");
    });

    it("should format Message-ID with angle brackets", () => {
      const headers = addComplianceHeaders(
        {},
        {
          unsubscribeUrl: "https://app.com/unsub/token",
          trackingId: "trk_123",
        }
      );

      expect(headers["Message-ID"]).toMatch(/^<.+>$/);
    });

    it("should format List-Unsubscribe with angle brackets", () => {
      const headers = addComplianceHeaders(
        {},
        {
          unsubscribeUrl: "https://app.com/unsub/token",
          trackingId: "trk_123",
        }
      );

      expect(headers["List-Unsubscribe"]).toMatch(/^<.+>$/);
    });
  });

  describe("generateUnsubscribeUrl", () => {
    it("should generate unsubscribe URL with token", () => {
      const url = generateUnsubscribeUrl("token123");

      expect(url).toBe("https://app.example.com/api/email/unsubscribe/token123");
    });

    it("should use custom baseUrl when provided", () => {
      const url = generateUnsubscribeUrl("token123", "https://custom.com");

      expect(url).toBe("https://custom.com/api/email/unsubscribe/token123");
    });

    it("should handle empty APP_URL", () => {
      vi.stubEnv("NEXT_PUBLIC_PUBLIC_APP_URL", "");
      const url = generateUnsubscribeUrl("token123");

      expect(url).toBe("/api/email/unsubscribe/token123");
    });
  });

  describe("generateOneClickUnsubscribeUrl", () => {
    it("should generate one-click unsubscribe URL with oneClick param", () => {
      const url = generateOneClickUnsubscribeUrl("token123");

      expect(url).toBe("https://app.example.com/api/email/unsubscribe/token123?oneClick=true");
    });

    it("should use custom baseUrl when provided", () => {
      const url = generateOneClickUnsubscribeUrl("token123", "https://custom.com");

      expect(url).toBe("https://custom.com/api/email/unsubscribe/token123?oneClick=true");
    });
  });
});

describe("Unsubscribe Token", () => {
  describe("generateUnsubscribeToken", () => {
    it("should generate token with unsub_ prefix", () => {
      const token = generateUnsubscribeToken("user@example.com");

      expect(token).toMatch(/^unsub_[a-f0-9]+$/);
    });

    it("should generate unique tokens for same email", () => {
      const token1 = generateUnsubscribeToken("user@example.com");
      const token2 = generateUnsubscribeToken("user@example.com");

      expect(token1).not.toBe(token2);
    });

    it("should generate tokens of consistent length", () => {
      const token1 = generateUnsubscribeToken("user@example.com");
      const token2 = generateUnsubscribeToken("another@example.com");

      // unsub_ (6) + 32 hex chars = 38 total
      expect(token1.length).toBe(38);
      expect(token2.length).toBe(38);
    });

    it("should handle emails with special characters", () => {
      const token = generateUnsubscribeToken("user+tag@example.com");

      expect(token).toMatch(/^unsub_[a-f0-9]+$/);
    });
  });
});
