/**
 * @buildbase/email - Types Tests
 * Validate type definitions and constants
 */

import { describe, it, expect } from "vitest";
import {
  PROVIDER_CONFIG_SCHEMA,
  type ProviderType,
  type SendEmailOptions,
  type SendResult,
} from "../src/core/types.js";
import {
  ENCRYPTION_ALGORITHM,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
  MAX_SUBJECT_LENGTH,
  MAX_HTML_SIZE,
  MAX_ATTACHMENT_SIZE,
  DEFAULT_PROVIDER_TYPE,
  EMAIL_REGEX,
} from "../src/core/constants.js";

describe("Types and Constants", () => {
  describe("PROVIDER_CONFIG_SCHEMA", () => {
    it("should have schema for all provider types", () => {
      const types: ProviderType[] = ["CONSOLE", "SMTP", "RESEND", "MAILGUN", "SENDGRID", "SES"];

      for (const type of types) {
        expect(PROVIDER_CONFIG_SCHEMA[type]).toBeDefined();
        expect(Array.isArray(PROVIDER_CONFIG_SCHEMA[type])).toBe(true);
      }
    });

    it("should have correct required fields for SMTP", () => {
      expect(PROVIDER_CONFIG_SCHEMA.SMTP).toContain("host");
      expect(PROVIDER_CONFIG_SCHEMA.SMTP).toContain("port");
      expect(PROVIDER_CONFIG_SCHEMA.SMTP).toContain("username");
      expect(PROVIDER_CONFIG_SCHEMA.SMTP).toContain("password");
    });

    it("should have correct required fields for RESEND", () => {
      expect(PROVIDER_CONFIG_SCHEMA.RESEND).toContain("apiKey");
    });

    it("should have correct required fields for MAILGUN", () => {
      expect(PROVIDER_CONFIG_SCHEMA.MAILGUN).toContain("apiKey");
      expect(PROVIDER_CONFIG_SCHEMA.MAILGUN).toContain("domain");
    });

    it("should have correct required fields for SENDGRID", () => {
      expect(PROVIDER_CONFIG_SCHEMA.SENDGRID).toContain("apiKey");
    });

    it("should have correct required fields for SES", () => {
      expect(PROVIDER_CONFIG_SCHEMA.SES).toContain("region");
      expect(PROVIDER_CONFIG_SCHEMA.SES).toContain("accessKeyId");
      expect(PROVIDER_CONFIG_SCHEMA.SES).toContain("secretAccessKey");
    });

    it("should have empty schema for CONSOLE", () => {
      expect(PROVIDER_CONFIG_SCHEMA.CONSOLE).toEqual([]);
    });
  });

  describe("Constants", () => {
    it("should have correct encryption algorithm", () => {
      expect(ENCRYPTION_ALGORITHM).toBe("aes-256-gcm");
    });

    it("should have correct IV length", () => {
      expect(IV_LENGTH).toBe(16);
    });

    it("should have correct auth tag length", () => {
      expect(AUTH_TAG_LENGTH).toBe(16);
    });

    it("should have correct max subject length (RFC 2822)", () => {
      expect(MAX_SUBJECT_LENGTH).toBe(998);
    });

    it("should have correct max HTML size (10MB)", () => {
      expect(MAX_HTML_SIZE).toBe(10 * 1024 * 1024);
    });

    it("should have correct max attachment size (25MB)", () => {
      expect(MAX_ATTACHMENT_SIZE).toBe(25 * 1024 * 1024);
    });

    it("should have correct default provider type", () => {
      expect(DEFAULT_PROVIDER_TYPE).toBe("CONSOLE");
    });

    it("should have valid email regex", () => {
      // Valid emails
      expect(EMAIL_REGEX.test("user@example.com")).toBe(true);
      expect(EMAIL_REGEX.test("user.name@example.co.uk")).toBe(true);
      expect(EMAIL_REGEX.test("user+tag@example.com")).toBe(true);

      // Invalid emails
      expect(EMAIL_REGEX.test("not-an-email")).toBe(false);
      expect(EMAIL_REGEX.test("@example.com")).toBe(false);
      expect(EMAIL_REGEX.test("user@")).toBe(false);
      expect(EMAIL_REGEX.test("user @example.com")).toBe(false);
    });
  });

  describe("Type Validation (Runtime Checks)", () => {
    it("should create valid SendEmailOptions", () => {
      const options: SendEmailOptions = {
        to: "user@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      };

      expect(options.to).toBe("user@example.com");
      expect(options.subject).toBe("Test");
      expect(options.html).toBe("<p>Test</p>");
    });

    it("should create SendEmailOptions with all fields", () => {
      const options: SendEmailOptions = {
        to: ["user1@example.com", "user2@example.com"],
        subject: "Test",
        html: "<p>Test</p>",
        text: "Test",
        from: { email: "sender@example.com", name: "Sender" },
        replyTo: "reply@example.com",
        cc: ["cc@example.com"],
        bcc: ["bcc@example.com"],
        attachments: [{ filename: "test.pdf", content: "base64" }],
        headers: { "X-Custom": "value" },
        tags: ["tag1", "tag2"],
        metadata: { key: "value" },
        trackingId: "trk_123",
        disableTracking: false,
        providerId: "provider_123",
      };

      expect(options.to).toHaveLength(2);
      expect(options.cc).toHaveLength(1);
      expect(options.attachments).toHaveLength(1);
    });

    it("should create valid SendResult", () => {
      const result: SendResult = {
        success: true,
        messageId: "msg_123",
        provider: "Test Provider",
        providerId: "provider_123",
        timestamp: new Date(),
        trackingId: "trk_123",
      };

      expect(result.success).toBe(true);
      expect(result.trackingId).toBe("trk_123");
    });

    it("should create SendResult with errors", () => {
      const result: SendResult = {
        success: false,
        messageId: "",
        provider: "Test Provider",
        providerId: "provider_123",
        timestamp: new Date(),
        trackingId: "trk_123",
        errors: ["Connection failed", "Timeout"],
      };

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });
});
