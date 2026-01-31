/**
 * @buildbase/email - Validation Tests
 */

import { describe, it, expect } from "vitest";
import {
  validateEmail,
  normalizeEmail,
  validateEmails,
  validateSubject,
  validateHtml,
  validateAttachment,
  validateSendOptions,
} from "../src/core/validation.js";
import { ValidationError } from "../src/core/errors.js";

describe("Validation", () => {
  describe("validateEmail", () => {
    it("should return true for valid emails", () => {
      expect(validateEmail("user@example.com")).toBe(true);
      expect(validateEmail("user.name@example.com")).toBe(true);
      expect(validateEmail("user+tag@example.co.uk")).toBe(true);
      expect(validateEmail("user123@test.org")).toBe(true);
    });

    it("should return false for invalid emails", () => {
      expect(validateEmail("not-an-email")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("user @example.com")).toBe(false);
      expect(validateEmail("")).toBe(false);
    });
  });

  describe("normalizeEmail", () => {
    it("should normalize valid emails to lowercase", () => {
      expect(normalizeEmail("User@Example.COM")).toBe("user@example.com");
      expect(normalizeEmail("  user@example.com  ")).toBe("user@example.com");
    });

    it("should throw ValidationError for empty email", () => {
      expect(() => normalizeEmail("")).toThrow(ValidationError);
      expect(() => normalizeEmail("   ")).toThrow(ValidationError);
    });

    it("should throw ValidationError for invalid email", () => {
      expect(() => normalizeEmail("not-an-email")).toThrow(ValidationError);
      expect(() => normalizeEmail("not-an-email")).toThrow("Invalid email address");
    });

    it("should include field name in error", () => {
      try {
        normalizeEmail("bad-email", "recipient");
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);
        expect((e as ValidationError).field).toBe("recipient");
      }
    });
  });

  describe("validateEmails", () => {
    it("should validate single email string", () => {
      const result = validateEmails("user@example.com");
      expect(result).toEqual(["user@example.com"]);
    });

    it("should validate array of emails", () => {
      const result = validateEmails(["user1@example.com", "user2@example.com"]);
      expect(result).toEqual(["user1@example.com", "user2@example.com"]);
    });

    it("should normalize all emails", () => {
      const result = validateEmails(["USER@Example.com", "Admin@TEST.org"]);
      expect(result).toEqual(["user@example.com", "admin@test.org"]);
    });

    it("should throw for empty array", () => {
      expect(() => validateEmails([])).toThrow(ValidationError);
      expect(() => validateEmails([])).toThrow("At least one recipient");
    });

    it("should throw for too many recipients", () => {
      const tooMany = Array.from({ length: 51 }, (_, i) => `user${i}@example.com`);
      expect(() => validateEmails(tooMany)).toThrow(ValidationError);
      expect(() => validateEmails(tooMany)).toThrow("Too many recipients");
    });

    it("should throw with index for invalid email in array", () => {
      try {
        validateEmails(["valid@example.com", "invalid", "valid2@example.com"]);
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);
        expect((e as ValidationError).field).toBe("to[1]");
      }
    });
  });

  describe("validateSubject", () => {
    it("should return trimmed subject", () => {
      expect(validateSubject("  Test Subject  ")).toBe("Test Subject");
    });

    it("should throw for empty subject", () => {
      expect(() => validateSubject("")).toThrow(ValidationError);
      expect(() => validateSubject("   ")).toThrow(ValidationError);
      expect(() => validateSubject("")).toThrow("Subject is required");
    });

    it("should throw for subject exceeding max length", () => {
      const longSubject = "a".repeat(1000);
      expect(() => validateSubject(longSubject)).toThrow(ValidationError);
      expect(() => validateSubject(longSubject)).toThrow("Subject too long");
    });

    it("should accept subject at max length", () => {
      const maxSubject = "a".repeat(998);
      expect(validateSubject(maxSubject)).toBe(maxSubject);
    });
  });

  describe("validateHtml", () => {
    it("should return HTML content", () => {
      const html = "<h1>Hello</h1>";
      expect(validateHtml(html)).toBe(html);
    });

    it("should throw for empty HTML", () => {
      expect(() => validateHtml("")).toThrow(ValidationError);
      expect(() => validateHtml("   ")).toThrow(ValidationError);
      expect(() => validateHtml("")).toThrow("HTML content is required");
    });

    it("should throw for HTML exceeding max size", () => {
      const largeHtml = "a".repeat(11 * 1024 * 1024); // 11MB
      expect(() => validateHtml(largeHtml)).toThrow(ValidationError);
      expect(() => validateHtml(largeHtml)).toThrow("HTML content too large");
    });
  });

  describe("validateAttachment", () => {
    it("should accept valid attachment", () => {
      expect(() =>
        validateAttachment({
          filename: "document.pdf",
          content: "base64content",
        })
      ).not.toThrow();
    });

    it("should accept attachment with Buffer content", () => {
      expect(() =>
        validateAttachment({
          filename: "image.png",
          content: Buffer.from("test"),
        })
      ).not.toThrow();
    });

    it("should throw for missing filename", () => {
      expect(() =>
        validateAttachment({
          filename: "",
          content: "content",
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateAttachment({
          filename: "",
          content: "content",
        })
      ).toThrow("filename is required");
    });

    it("should throw for attachment exceeding max size", () => {
      const largeContent = Buffer.alloc(26 * 1024 * 1024); // 26MB
      expect(() =>
        validateAttachment({
          filename: "large.bin",
          content: largeContent,
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateAttachment({
          filename: "large.bin",
          content: largeContent,
        })
      ).toThrow("Attachment too large");
    });
  });

  describe("validateSendOptions", () => {
    it("should return valid for correct options", () => {
      const result = validateSendOptions({
        to: "user@example.com",
        subject: "Test",
        html: "<p>Hello</p>",
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return errors for invalid options", () => {
      const result = validateSendOptions({
        to: "invalid-email",
        subject: "",
        html: "",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should collect all validation errors", () => {
      const result = validateSendOptions({
        to: "",
        subject: "",
        html: "",
      });

      expect(result.valid).toBe(false);
      // Should have errors for to, subject, and html
      const fields = result.errors.map(e => e.field);
      expect(fields).toContain("to");
      expect(fields).toContain("subject");
      expect(fields).toContain("html");
    });

    it("should validate from.email if provided", () => {
      const result = validateSendOptions({
        to: "user@example.com",
        subject: "Test",
        html: "<p>Hello</p>",
        from: { email: "invalid-from", name: "Sender" },
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === "from.email")).toBe(true);
    });

    it("should validate attachments if provided", () => {
      const result = validateSendOptions({
        to: "user@example.com",
        subject: "Test",
        html: "<p>Hello</p>",
        attachments: [{ filename: "", content: "test" }],
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field.includes("attachments"))).toBe(true);
    });

    it("should pass with valid attachments", () => {
      const result = validateSendOptions({
        to: "user@example.com",
        subject: "Test",
        html: "<p>Hello</p>",
        attachments: [
          { filename: "doc.pdf", content: "base64content" },
          { filename: "image.png", content: Buffer.from("test") },
        ],
      });

      expect(result.valid).toBe(true);
    });
  });
});
