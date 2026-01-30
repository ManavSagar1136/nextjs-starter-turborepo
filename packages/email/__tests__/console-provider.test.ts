/**
 * @buildbase/email - Console Provider Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConsoleProvider, createConsoleProvider } from "../src/providers/console.provider.js";
import type { SendEmailOptions } from "../src/core/types.js";

describe("ConsoleProvider", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("constructor", () => {
    it("should create with default values", () => {
      const provider = new ConsoleProvider();

      expect(provider.id).toBe("console-dev");
      expect(provider.name).toBe("Console (Development)");
      expect(provider.type).toBe("CONSOLE");
      expect(provider.fromEmail).toBe("dev@localhost");
      expect(provider.fromName).toBe("Dev Mode");
    });

    it("should create with custom values", () => {
      const provider = new ConsoleProvider({
        id: "custom-id",
        name: "Custom Console",
        type: "CONSOLE",
        fromName: "Test App",
        fromEmail: "test@example.com",
        replyTo: "reply@example.com",
      });

      expect(provider.id).toBe("custom-id");
      expect(provider.name).toBe("Custom Console");
      expect(provider.fromEmail).toBe("test@example.com");
      expect(provider.fromName).toBe("Test App");
    });
  });

  describe("send", () => {
    it("should return success result", async () => {
      const provider = new ConsoleProvider();
      const options: SendEmailOptions = {
        to: "user@example.com",
        subject: "Test Subject",
        html: "<h1>Hello</h1>",
      };

      const result = await provider.send(options);

      expect(result.success).toBe(true);
      expect(result.provider).toBe("Console (Development)");
      expect(result.providerId).toBe("console-dev");
      expect(result.messageId).toMatch(/^console_/);
      expect(result.trackingId).toMatch(/^trk_/);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it("should log email details", async () => {
      const provider = new ConsoleProvider();
      const options: SendEmailOptions = {
        to: "user@example.com",
        subject: "Test Subject",
        html: "<h1>Hello</h1>",
      };

      await provider.send(options);

      expect(consoleSpy).toHaveBeenCalled();
      const logOutput = consoleSpy.mock.calls.map(c => c[0]).join("\n");

      expect(logOutput).toContain("EMAIL SENT");
      expect(logOutput).toContain("user@example.com");
      expect(logOutput).toContain("Test Subject");
    });

    it("should handle multiple recipients", async () => {
      const provider = new ConsoleProvider();
      const options: SendEmailOptions = {
        to: ["user1@example.com", "user2@example.com"],
        subject: "Test",
        html: "<p>Test</p>",
      };

      const result = await provider.send(options);

      expect(result.success).toBe(true);
      const logOutput = consoleSpy.mock.calls.map(c => c[0]).join("\n");
      expect(logOutput).toContain("user1@example.com, user2@example.com");
    });

    it("should log CC and BCC", async () => {
      const provider = new ConsoleProvider();
      const options: SendEmailOptions = {
        to: "user@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        cc: ["cc@example.com"],
        bcc: ["bcc@example.com"],
      };

      await provider.send(options);

      const logOutput = consoleSpy.mock.calls.map(c => c[0]).join("\n");
      expect(logOutput).toContain("cc@example.com");
      expect(logOutput).toContain("bcc@example.com");
    });

    it("should use provided tracking ID", async () => {
      const provider = new ConsoleProvider();
      const options: SendEmailOptions = {
        to: "user@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        trackingId: "custom_tracking_123",
      };

      const result = await provider.send(options);

      expect(result.trackingId).toBe("custom_tracking_123");
    });

    it("should log attachments", async () => {
      const provider = new ConsoleProvider();
      const options: SendEmailOptions = {
        to: "user@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        attachments: [
          { filename: "doc.pdf", content: "base64content" },
          { filename: "image.png", content: "base64content" },
        ],
      };

      await provider.send(options);

      const logOutput = consoleSpy.mock.calls.map(c => c[0]).join("\n");
      expect(logOutput).toContain("doc.pdf");
      expect(logOutput).toContain("image.png");
    });

    it("should log tags", async () => {
      const provider = new ConsoleProvider();
      const options: SendEmailOptions = {
        to: "user@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        tags: ["marketing", "newsletter"],
      };

      await provider.send(options);

      const logOutput = consoleSpy.mock.calls.map(c => c[0]).join("\n");
      expect(logOutput).toContain("marketing");
      expect(logOutput).toContain("newsletter");
    });

    it("should truncate long HTML in preview", async () => {
      const provider = new ConsoleProvider();
      const longHtml = "<p>" + "a".repeat(1000) + "</p>";
      const options: SendEmailOptions = {
        to: "user@example.com",
        subject: "Test",
        html: longHtml,
      };

      await provider.send(options);

      const logOutput = consoleSpy.mock.calls.map(c => c[0]).join("\n");
      expect(logOutput).toContain("...");
    });
  });

  describe("sendBulk", () => {
    it("should send multiple emails", async () => {
      const provider = new ConsoleProvider();
      const emails: SendEmailOptions[] = [
        { to: "user1@example.com", subject: "Test 1", html: "<p>1</p>" },
        { to: "user2@example.com", subject: "Test 2", html: "<p>2</p>" },
        { to: "user3@example.com", subject: "Test 3", html: "<p>3</p>" },
      ];

      const result = await provider.sendBulk(emails);

      expect(result.total).toBe(3);
      expect(result.successful.length).toBe(3);
      expect(result.failed.length).toBe(0);
    });
  });

  describe("testConnection", () => {
    it("should always return success", async () => {
      const provider = new ConsoleProvider();

      const result = await provider.testConnection();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("createConsoleProvider", () => {
    it("should create a console provider instance", () => {
      const provider = createConsoleProvider();

      expect(provider).toBeInstanceOf(ConsoleProvider);
      expect(provider.type).toBe("CONSOLE");
    });
  });
});
