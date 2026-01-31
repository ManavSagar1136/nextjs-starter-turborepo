/**
 * @buildbase/email - Queue Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EmailQueueService } from "../src/queue/queue.service.js";
import { QueueNotConfiguredError, QueueOperationError } from "../src/queue/errors.js";
import type { SendEmailOptions } from "../src/core/types.js";

// Create stable mock functions that persist across tests
const mockPublishJSON = vi.fn().mockResolvedValue({ messageId: "qstash_msg_123" });
const mockDeleteSchedule = vi.fn().mockResolvedValue(undefined);

// Mock @buildbase/qstash
vi.mock("@buildbase/qstash/factory", () => ({
  createQStashFactory: vi.fn(() => ({
    client: {
      publishJSON: mockPublishJSON,
      deleteSchedule: mockDeleteSchedule,
    },
  })),
}));

describe("EmailQueueService", () => {
  let queueService: EmailQueueService;
  const testEmail: SendEmailOptions = {
    to: "user@example.com",
    subject: "Test Email",
    html: "<p>Hello</p>",
  };

  beforeEach(() => {
    vi.stubEnv("QSTASH_TOKEN", "test_token");
    vi.stubEnv("APP_URL", "https://app.example.com");
    queueService = new EmailQueueService();

    // Reset mock implementations
    mockPublishJSON.mockClear();
    mockPublishJSON.mockResolvedValue({ messageId: "qstash_msg_123" });
    mockDeleteSchedule.mockClear();
    mockDeleteSchedule.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("initialize", () => {
    it("should initialize when QSTASH_TOKEN and APP_URL are set", async () => {
      await queueService.initialize();

      expect(queueService.configured).toBe(true);
    });

    it("should not configure when QSTASH_TOKEN is missing", async () => {
      vi.stubEnv("QSTASH_TOKEN", "");
      const service = new EmailQueueService();
      await service.initialize();

      expect(service.configured).toBe(false);
    });

    it("should not configure when APP_URL is missing", async () => {
      vi.stubEnv("APP_URL", "");
      const service = new EmailQueueService();
      await service.initialize();

      expect(service.configured).toBe(false);
    });
  });

  describe("enqueue", () => {
    beforeEach(async () => {
      await queueService.initialize();
    });

    it("should queue an email and return messageId", async () => {
      const result = await queueService.enqueue(testEmail);

      expect(result.messageId).toBe("qstash_msg_123");
      expect(result.status).toBe("queued");
    });

    it("should return scheduled status when delay is provided", async () => {
      const result = await queueService.enqueue(testEmail, { delay: 5000 });

      expect(result.status).toBe("scheduled");
    });

    it("should return scheduled status when scheduledAt is provided", async () => {
      const futureDate = new Date(Date.now() + 60000);
      const result = await queueService.enqueue(testEmail, { scheduledAt: futureDate });

      expect(result.status).toBe("scheduled");
      expect(result.scheduledFor).toEqual(futureDate);
    });

    it("should throw QueueNotConfiguredError when not initialized", async () => {
      vi.stubEnv("QSTASH_TOKEN", "");
      const service = new EmailQueueService();
      await service.initialize();

      await expect(service.enqueue(testEmail)).rejects.toThrow(QueueNotConfiguredError);
    });
  });

  describe("delay", () => {
    beforeEach(async () => {
      await queueService.initialize();
    });

    it("should queue email with numeric delay", async () => {
      const result = await queueService.delay(testEmail, 5000);

      expect(result.messageId).toBe("qstash_msg_123");
      expect(result.status).toBe("scheduled");
    });

    it("should queue email with string delay", async () => {
      const result = await queueService.delay(testEmail, "5m");

      expect(result.messageId).toBe("qstash_msg_123");
    });
  });

  describe("schedule", () => {
    beforeEach(async () => {
      await queueService.initialize();
    });

    it("should schedule email for future time", async () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour
      const result = await queueService.schedule(testEmail, futureDate);

      expect(result.messageId).toBe("qstash_msg_123");
    });

    it("should schedule email with string date", async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      const result = await queueService.schedule(testEmail, futureDate);

      expect(result.messageId).toBe("qstash_msg_123");
    });

    it("should queue immediately if scheduled time is in the past", async () => {
      const pastDate = new Date(Date.now() - 1000);
      const result = await queueService.schedule(testEmail, pastDate);

      expect(result.messageId).toBe("qstash_msg_123");
      // When past, no scheduledFor should be set
    });
  });

  describe("enqueueBulk", () => {
    beforeEach(async () => {
      await queueService.initialize();
    });

    it("should queue multiple emails", async () => {
      const emails: SendEmailOptions[] = [
        { to: "user1@example.com", subject: "Test 1", html: "<p>1</p>" },
        { to: "user2@example.com", subject: "Test 2", html: "<p>2</p>" },
        { to: "user3@example.com", subject: "Test 3", html: "<p>3</p>" },
      ];

      const result = await queueService.enqueueBulk(emails);

      expect(result.total).toBe(3);
      expect(result.queued).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.messageIds).toHaveLength(3);
    });

    it("should handle partial failures", async () => {
      // Configure mock to fail on second call
      mockPublishJSON
        .mockResolvedValueOnce({ messageId: "msg_1" })
        .mockRejectedValueOnce(new Error("Failed"))
        .mockResolvedValueOnce({ messageId: "msg_3" });

      const emails: SendEmailOptions[] = [
        { to: "user1@example.com", subject: "Test 1", html: "<p>1</p>" },
        { to: "user2@example.com", subject: "Test 2", html: "<p>2</p>" },
        { to: "user3@example.com", subject: "Test 3", html: "<p>3</p>" },
      ];

      const result = await queueService.enqueueBulk(emails);

      expect(result.total).toBe(3);
      expect(result.queued).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it("should stagger emails with delay", async () => {
      const emails: SendEmailOptions[] = [
        { to: "user1@example.com", subject: "Test 1", html: "<p>1</p>" },
        { to: "user2@example.com", subject: "Test 2", html: "<p>2</p>" },
      ];

      const result = await queueService.enqueueBulk(emails, { delay: 1000 });

      expect(result.queued).toBe(2);
      expect(mockPublishJSON).toHaveBeenCalledTimes(2);
    });
  });

  describe("cancel", () => {
    beforeEach(async () => {
      await queueService.initialize();
    });

    it("should cancel a scheduled email", async () => {
      const result = await queueService.cancel("qstash_msg_123");

      expect(result).toBe(true);
      expect(mockDeleteSchedule).toHaveBeenCalledWith("qstash_msg_123");
    });

    it("should return false when cancellation fails", async () => {
      // Configure mock to throw
      mockDeleteSchedule.mockRejectedValueOnce(new Error("Not found"));

      const result = await queueService.cancel("nonexistent");

      expect(result).toBe(false);
    });
  });

  describe("parseDelay (private, tested via delay)", () => {
    beforeEach(async () => {
      await queueService.initialize();
    });

    it("should handle milliseconds", async () => {
      const result = await queueService.delay(testEmail, "100ms");
      expect(result.messageId).toBeDefined();
    });

    it("should handle seconds", async () => {
      const result = await queueService.delay(testEmail, "30s");
      expect(result.messageId).toBeDefined();
    });

    it("should handle minutes", async () => {
      const result = await queueService.delay(testEmail, "5m");
      expect(result.messageId).toBeDefined();
    });

    it("should handle hours", async () => {
      const result = await queueService.delay(testEmail, "2h");
      expect(result.messageId).toBeDefined();
    });

    it("should handle days", async () => {
      const result = await queueService.delay(testEmail, "1d");
      expect(result.messageId).toBeDefined();
    });

    it("should handle plain numbers in string", async () => {
      const result = await queueService.delay(testEmail, "5000");
      expect(result.messageId).toBeDefined();
    });
  });
});

describe("Queue Errors", () => {
  describe("QueueNotConfiguredError", () => {
    it("should create with correct message", () => {
      const error = new QueueNotConfiguredError();

      expect(error.message).toContain("not configured");
      expect(error.code).toBe("QUEUE_NOT_CONFIGURED");
    });
  });

  describe("QueueOperationError", () => {
    it("should create with operation name", () => {
      const error = new QueueOperationError("Failed to queue", "enqueue");

      expect(error.message).toBe("Failed to queue");
      expect(error.operation).toBe("enqueue");
      expect(error.code).toBe("QUEUE_OPERATION_ERROR");
    });

    it("should include cause if provided", () => {
      const cause = new Error("Network error");
      const error = new QueueOperationError("Failed", "enqueue", cause);

      expect(error.cause).toBe(cause);
    });
  });
});
