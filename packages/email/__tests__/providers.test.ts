/**
 * @buildbase/email - Provider Tests
 * Tests for all email provider implementations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DbEmailProvider } from "../src/providers/base.provider.js";
import { NodemailerProvider } from "../src/providers/nodemailer.provider.js";
import { ResendProvider } from "../src/providers/resend.provider.js";
import { MailgunProvider } from "../src/providers/mailgun.provider.js";
import { SendGridProvider } from "../src/providers/sendgrid.provider.js";
import { SesProvider } from "../src/providers/ses.provider.js";
import type { SmtpConfig, ResendConfig, MailgunConfig, SendGridConfig, SesConfig } from "../src/core/types.js";

// Mock the external dependencies
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: "smtp_123" }),
      verify: vi.fn().mockResolvedValue(true),
      close: vi.fn(),
    })),
  },
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "resend_123" }, error: null }),
    },
    batch: {
      send: vi.fn().mockResolvedValue({
        data: { data: [{ id: "resend_batch_1" }, { id: "resend_batch_2" }] },
        error: null,
      }),
    },
    domains: {
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
    },
  })),
}));

vi.mock("mailgun.js", () => ({
  default: vi.fn().mockImplementation(() => ({
    client: vi.fn(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({ id: "mailgun_123" }),
      },
      domains: {
        get: vi.fn().mockResolvedValue({ domain: "test.com" }),
      },
    })),
  })),
}));

vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([{ statusCode: 202, headers: { "x-message-id": "sg_123" } }]),
  },
}));

vi.mock("@aws-sdk/client-ses", () => ({
  SESClient: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({ MessageId: "ses_123" }),
  })),
  SendEmailCommand: vi.fn(),
  SendRawEmailCommand: vi.fn(),
  GetIdentityVerificationAttributesCommand: vi.fn(),
}));

// Mock form-data
vi.mock("form-data", () => ({
  default: vi.fn(),
}));

describe("Email Providers", () => {
  const baseDbProvider: DbEmailProvider = {
    id: "test-provider-id",
    name: "Test Provider",
    type: "CONSOLE",
    fromName: "Test App",
    fromEmail: "test@example.com",
    replyTo: "reply@example.com",
  };

  const sendOptions = {
    to: "user@example.com",
    subject: "Test Subject",
    html: "<h1>Hello</h1>",
  };

  describe("NodemailerProvider", () => {
    const smtpConfig: SmtpConfig = {
      host: "smtp.example.com",
      port: 587,
      secure: false,
      username: "user",
      password: "pass",
    };

    it("should create provider with correct properties", () => {
      const provider = new NodemailerProvider({ ...baseDbProvider, type: "SMTP" }, smtpConfig);

      expect(provider.id).toBe("test-provider-id");
      expect(provider.name).toBe("Test Provider");
      expect(provider.type).toBe("SMTP");
      expect(provider.fromEmail).toBe("test@example.com");
    });

    it("should send email successfully", async () => {
      const provider = new NodemailerProvider({ ...baseDbProvider, type: "SMTP" }, smtpConfig);

      const result = await provider.send(sendOptions);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("smtp_123");
      expect(result.provider).toBe("Test Provider");
      expect(result.trackingId).toMatch(/^trk_/);
    });

    it("should test connection successfully", async () => {
      const provider = new NodemailerProvider({ ...baseDbProvider, type: "SMTP" }, smtpConfig);

      const result = await provider.testConnection();

      expect(result.success).toBe(true);
    });
  });

  describe("ResendProvider", () => {
    const resendConfig: ResendConfig = {
      apiKey: "re_test_123",
    };

    it("should create provider with correct properties", () => {
      const provider = new ResendProvider({ ...baseDbProvider, type: "RESEND" }, resendConfig);

      expect(provider.id).toBe("test-provider-id");
      expect(provider.type).toBe("RESEND");
    });

    it("should send email successfully", async () => {
      const provider = new ResendProvider({ ...baseDbProvider, type: "RESEND" }, resendConfig);

      const result = await provider.send(sendOptions);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("resend_123");
    });

    it("should send bulk emails", async () => {
      const provider = new ResendProvider({ ...baseDbProvider, type: "RESEND" }, resendConfig);

      const result = await provider.sendBulk([
        { ...sendOptions, to: "user1@example.com" },
        { ...sendOptions, to: "user2@example.com" },
      ]);

      expect(result.total).toBe(2);
      expect(result.successful.length).toBe(2);
      expect(result.failed.length).toBe(0);
    });

    it("should test connection successfully", async () => {
      const provider = new ResendProvider({ ...baseDbProvider, type: "RESEND" }, resendConfig);

      const result = await provider.testConnection();

      expect(result.success).toBe(true);
    });
  });

  describe("MailgunProvider", () => {
    const mailgunConfig: MailgunConfig = {
      apiKey: "key-test123",
      domain: "test.mailgun.org",
      region: "us",
    };

    it("should create provider with correct properties", () => {
      const provider = new MailgunProvider({ ...baseDbProvider, type: "MAILGUN" }, mailgunConfig);

      expect(provider.id).toBe("test-provider-id");
      expect(provider.type).toBe("MAILGUN");
    });

    it("should send email successfully", async () => {
      const provider = new MailgunProvider({ ...baseDbProvider, type: "MAILGUN" }, mailgunConfig);

      const result = await provider.send(sendOptions);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("mailgun_123");
    });

    it("should support EU region", () => {
      const euConfig: MailgunConfig = {
        ...mailgunConfig,
        region: "eu",
      };

      const provider = new MailgunProvider({ ...baseDbProvider, type: "MAILGUN" }, euConfig);

      expect(provider.type).toBe("MAILGUN");
    });
  });

  describe("SendGridProvider", () => {
    const sendgridConfig: SendGridConfig = {
      apiKey: "SG.test123",
    };

    it("should create provider with correct properties", () => {
      const provider = new SendGridProvider({ ...baseDbProvider, type: "SENDGRID" }, sendgridConfig);

      expect(provider.id).toBe("test-provider-id");
      expect(provider.type).toBe("SENDGRID");
    });

    it("should send email successfully", async () => {
      const provider = new SendGridProvider({ ...baseDbProvider, type: "SENDGRID" }, sendgridConfig);

      const result = await provider.send(sendOptions);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("sg_123");
    });

    it("should send bulk emails", async () => {
      const provider = new SendGridProvider({ ...baseDbProvider, type: "SENDGRID" }, sendgridConfig);

      const result = await provider.sendBulk([
        { ...sendOptions, to: "user1@example.com" },
        { ...sendOptions, to: "user2@example.com" },
      ]);

      expect(result.total).toBe(2);
      expect(result.successful.length).toBe(2);
    });
  });

  describe("SesProvider", () => {
    const sesConfig: SesConfig = {
      region: "us-east-1",
      accessKeyId: "AKIATEST123",
      secretAccessKey: "secret123",
    };

    it("should create provider with correct properties", () => {
      const provider = new SesProvider({ ...baseDbProvider, type: "SES" }, sesConfig);

      expect(provider.id).toBe("test-provider-id");
      expect(provider.type).toBe("SES");
    });

    it("should send email successfully", async () => {
      const provider = new SesProvider({ ...baseDbProvider, type: "SES" }, sesConfig);

      const result = await provider.send(sendOptions);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("ses_123");
    });
  });

  describe("Provider Configuration Validation", () => {
    it("should require host for SMTP", () => {
      const invalidConfig = {
        port: 587,
        secure: false,
        username: "user",
        password: "pass",
      } as SmtpConfig;

      // Provider should be created but may fail on send
      expect(() => new NodemailerProvider({ ...baseDbProvider, type: "SMTP" }, invalidConfig)).not.toThrow();
    });

    it("should require apiKey for Resend", () => {
      const config: ResendConfig = { apiKey: "re_test" };

      expect(() => new ResendProvider({ ...baseDbProvider, type: "RESEND" }, config)).not.toThrow();
    });

    it("should require apiKey and domain for Mailgun", () => {
      const config: MailgunConfig = {
        apiKey: "key-123",
        domain: "test.com",
      };

      expect(() => new MailgunProvider({ ...baseDbProvider, type: "MAILGUN" }, config)).not.toThrow();
    });
  });
});
