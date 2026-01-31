/**
 * @buildbase/email - Email Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EmailService, sendEmail } from "../src/service/email.service.js";
import { EmailFactory } from "../src/factory/email.factory.js";
import { EmailQueue } from "../src/queue/queue.service.js";
import { ConsoleProvider } from "../src/providers/console.provider.js";
import type { SendEmailOptions } from "../src/core/types.js";

// Mock the factory
vi.mock("../src/factory/email.factory.js", () => ({
  EmailFactory: {
    initialize: vi.fn(),
    getInstance: vi.fn(),
    isInitialized: vi.fn(() => true),
  },
}));

// Mock the queue
vi.mock("../src/queue/queue.service.js", () => ({
  EmailQueue: {
    initialize: vi.fn().mockResolvedValue(undefined),
    configured: false,
    enqueue: vi.fn().mockResolvedValue({
      messageId: "queue_msg_123",
      status: "queued",
    }),
    enqueueBulk: vi.fn().mockResolvedValue({
      total: 2,
      queued: 2,
      failed: 0,
      messageIds: ["msg_1", "msg_2"],
      errors: [],
    }),
    delay: vi.fn().mockResolvedValue({
      messageId: "delayed_msg_123",
      status: "scheduled",
    }),
    schedule: vi.fn().mockResolvedValue({
      messageId: "scheduled_msg_123",
      status: "scheduled",
    }),
  },
}));

describe("EmailService", () => {
  const mockProvider = new ConsoleProvider({
    id: "test-provider",
    name: "Test Provider",
    type: "CONSOLE",
    fromName: "Test",
    fromEmail: "test@example.com",
  });

  const mockProviderService = {
    incrementEmailsSent: vi.fn().mockResolvedValue(undefined),
  };

  const testEmail: SendEmailOptions = {
    to: "user@example.com",
    subject: "Test Subject",
    html: "<p>Hello World</p>",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});

    // Setup factory mock
    (EmailFactory.getInstance as ReturnType<typeof vi.fn>).mockReturnValue({
      getProvider: vi.fn().mockResolvedValue(mockProvider),
      getProviderService: vi.fn().mockReturnValue(mockProviderService),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialize", () => {
    it("should initialize factory and queue", async () => {
      const mockPrisma = {} as Parameters<typeof EmailService.initialize>[0];

      await EmailService.initialize(mockPrisma);

      expect(EmailFactory.initialize).toHaveBeenCalledWith(mockPrisma);
      expect(EmailQueue.initialize).toHaveBeenCalled();
    });
  });

  describe("isInitialized", () => {
    it("should return factory initialization status", () => {
      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(true);

      expect(EmailService.isInitialized()).toBe(true);
    });

    it("should return false when factory not initialized", () => {
      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(false);

      expect(EmailService.isInitialized()).toBe(false);
    });
  });

  describe("isQueueConfigured", () => {
    it("should return queue configuration status", () => {
      expect(EmailService.isQueueConfigured()).toBe(false);
    });
  });

  describe("send", () => {
    it("should send email directly when no queue options", async () => {
      const result = await EmailService.send(testEmail);

      expect(result.success).toBe(true);
      expect(result.provider).toBe("Test Provider");
    });

    it("should queue email when queue option is true", async () => {
      const result = await EmailService.send({ ...testEmail, queue: true });

      expect(EmailQueue.enqueue).toHaveBeenCalled();
      expect(result).toHaveProperty("messageId");
    });

    it("should queue email when delay is specified", async () => {
      const result = await EmailService.send({ ...testEmail, delay: 5000 });

      expect(EmailQueue.enqueue).toHaveBeenCalled();
    });

    it("should queue email when scheduledAt is specified", async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const result = await EmailService.send({ ...testEmail, scheduledAt: futureDate });

      expect(EmailQueue.enqueue).toHaveBeenCalled();
    });
  });

  describe("sendDirect", () => {
    it("should send email via provider", async () => {
      const result = await EmailService.sendDirect(testEmail);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^console_/);
    });

    it("should generate tracking ID if not provided", async () => {
      const result = await EmailService.sendDirect(testEmail);

      expect(result.trackingId).toMatch(/^trk_/);
    });

    it("should use provided tracking ID", async () => {
      const result = await EmailService.sendDirect({
        ...testEmail,
        trackingId: "custom_tracking_123",
      });

      expect(result.trackingId).toBe("custom_tracking_123");
    });

    it("should use notrack prefix when tracking is disabled", async () => {
      const result = await EmailService.sendDirect({
        ...testEmail,
        disableTracking: true,
      });

      expect(result.trackingId).toMatch(/^notrack_/);
    });

    it("should increment provider stats on success", async () => {
      await EmailService.sendDirect(testEmail);

      expect(mockProviderService.incrementEmailsSent).toHaveBeenCalledWith("test-provider");
    });

    it("should use specific provider when providerId is specified", async () => {
      const factory = EmailFactory.getInstance();

      await EmailService.sendDirect({ ...testEmail, providerId: "specific-provider" });

      expect(factory.getProvider).toHaveBeenCalledWith("specific-provider");
    });
  });

  describe("sendWith", () => {
    it("should send email with specific provider", async () => {
      const result = await EmailService.sendWith("specific-provider", testEmail);

      expect(result.success).toBe(true);
    });

    it("should support queue options", async () => {
      await EmailService.sendWith("specific-provider", { ...testEmail, queue: true });

      expect(EmailQueue.enqueue).toHaveBeenCalled();
    });
  });

  describe("sendBulk", () => {
    const bulkEmails: SendEmailOptions[] = [
      { to: "user1@example.com", subject: "Test 1", html: "<p>1</p>" },
      { to: "user2@example.com", subject: "Test 2", html: "<p>2</p>" },
    ];

    it("should send multiple emails", async () => {
      const result = await EmailService.sendBulk(bulkEmails);

      expect(result.total).toBe(2);
      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it("should use queue when queue option is true", async () => {
      (EmailQueue as unknown as { configured: boolean }).configured = true;

      const result = await EmailService.sendBulk(bulkEmails, { queue: true });

      expect(EmailQueue.enqueueBulk).toHaveBeenCalled();

      (EmailQueue as unknown as { configured: boolean }).configured = false;
    });

    it("should use specific provider for all emails", async () => {
      const factory = EmailFactory.getInstance();

      await EmailService.sendBulk(bulkEmails, { providerId: "bulk-provider" });

      expect(factory.getProvider).toHaveBeenCalledWith("bulk-provider");
    });

    it("should handle partial failures", async () => {
      // Create a provider that fails on second email
      let callCount = 0;
      const failingProvider = {
        ...mockProvider,
        send: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 2) {
            throw new Error("Send failed");
          }
          return Promise.resolve({
            success: true,
            messageId: `msg_${callCount}`,
            provider: "Test",
            providerId: "test",
            timestamp: new Date(),
            trackingId: `trk_${callCount}`,
          });
        }),
      };

      (EmailFactory.getInstance as ReturnType<typeof vi.fn>).mockReturnValue({
        getProvider: vi.fn().mockResolvedValue(failingProvider),
        getProviderService: vi.fn().mockReturnValue(mockProviderService),
      });

      const result = await EmailService.sendBulk(bulkEmails);

      expect(result.total).toBe(2);
      expect(result.failed.length).toBeGreaterThan(0);
    });
  });

  describe("delay", () => {
    it("should delay email sending", async () => {
      const result = await EmailService.delay(testEmail, 5000);

      expect(EmailQueue.delay).toHaveBeenCalledWith(testEmail, 5000);
      expect(result.messageId).toBe("delayed_msg_123");
    });

    it("should accept string delay", async () => {
      await EmailService.delay(testEmail, "5m");

      expect(EmailQueue.delay).toHaveBeenCalledWith(testEmail, "5m");
    });
  });

  describe("schedule", () => {
    it("should schedule email for specific time", async () => {
      const futureDate = new Date(Date.now() + 3600000);

      const result = await EmailService.schedule(testEmail, futureDate);

      expect(EmailQueue.schedule).toHaveBeenCalledWith(testEmail, futureDate);
      expect(result.messageId).toBe("scheduled_msg_123");
    });

    it("should accept string date", async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();

      await EmailService.schedule(testEmail, futureDate);

      expect(EmailQueue.schedule).toHaveBeenCalledWith(testEmail, futureDate);
    });
  });

  describe("getFactory", () => {
    it("should return factory instance", () => {
      const factory = EmailService.getFactory();

      expect(factory).toBeDefined();
    });
  });

  describe("getQueue", () => {
    it("should return queue service", () => {
      const queue = EmailService.getQueue();

      expect(queue).toBe(EmailQueue);
    });
  });
});

describe("sendEmail convenience function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});

    const mockProvider = new ConsoleProvider();

    (EmailFactory.getInstance as ReturnType<typeof vi.fn>).mockReturnValue({
      getProvider: vi.fn().mockResolvedValue(mockProvider),
      getProviderService: vi.fn().mockReturnValue({
        incrementEmailsSent: vi.fn(),
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call EmailService.send", async () => {
    const options = {
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    };

    const result = await sendEmail(options);

    expect(result.success).toBe(true);
  });
});
