/**
 * @buildbase/email - Health Check Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { healthCheck, quickHealthCheck, sendTestEmail } from "../src/core/health.js";
import { EmailFactory } from "../src/factory/email.factory.js";
import { EmailQueue } from "../src/queue/queue.service.js";
import { ConsoleProvider } from "../src/providers/console.provider.js";

// Mock the factory
vi.mock("../src/factory/email.factory.js", () => ({
  EmailFactory: {
    isInitialized: vi.fn(() => false),
    getInstance: vi.fn(),
  },
}));

// Mock the queue
vi.mock("../src/queue/queue.service.js", () => ({
  EmailQueue: {
    configured: false,
  },
}));

// Create mock Prisma client
function createMockPrisma(options: { dbSuccess?: boolean } = {}) {
  const { dbSuccess = true } = options;

  return {
    emailProvider: {
      count: dbSuccess ? vi.fn().mockResolvedValue(1) : vi.fn().mockRejectedValue(new Error("DB connection failed")),
    },
  } as unknown as Parameters<typeof healthCheck>[0];
}

describe("Health Check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("healthCheck", () => {
    it("should return unhealthy when factory not initialized", async () => {
      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(false);
      const prisma = createMockPrisma();

      const result = await healthCheck(prisma);

      expect(result.status).toBe("unhealthy");
      expect(result.components.defaultProvider.status).toBe("unhealthy");
      expect(result.components.defaultProvider.message).toContain("not initialized");
    });

    it("should check database connection", async () => {
      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(false);
      const prisma = createMockPrisma({ dbSuccess: true });

      const result = await healthCheck(prisma);

      expect(result.components.database.status).toBe("healthy");
      expect(result.components.database.latencyMs).toBeDefined();
    });

    it("should report unhealthy database on connection failure", async () => {
      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(false);
      const prisma = createMockPrisma({ dbSuccess: false });

      const result = await healthCheck(prisma);

      expect(result.components.database.status).toBe("unhealthy");
      expect(result.components.database.message).toContain("connection failed");
    });

    it("should check default provider when initialized", async () => {
      const mockProvider = new ConsoleProvider();
      const mockProviderService = {
        list: vi.fn().mockResolvedValue([]),
      };

      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (EmailFactory.getInstance as ReturnType<typeof vi.fn>).mockReturnValue({
        getProvider: vi.fn().mockResolvedValue(mockProvider),
        getProviderService: vi.fn().mockReturnValue(mockProviderService),
      });

      const prisma = createMockPrisma();
      const result = await healthCheck(prisma);

      expect(result.components.defaultProvider.status).toBe("healthy");
      expect(result.components.defaultProvider.message).toContain("Console");
    });

    it("should check queue configuration", async () => {
      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (EmailQueue as unknown as { configured: boolean }).configured = false;

      const prisma = createMockPrisma();
      const result = await healthCheck(prisma);

      expect(result.components.queue.status).toBe("degraded");
      expect(result.components.queue.message).toContain("not configured");
    });

    it("should report queue as healthy when configured", async () => {
      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (EmailQueue as unknown as { configured: boolean }).configured = true;

      const prisma = createMockPrisma();
      const result = await healthCheck(prisma);

      expect(result.components.queue.status).toBe("healthy");
      expect(result.components.queue.message).toContain("QStash configured");

      // Reset
      (EmailQueue as unknown as { configured: boolean }).configured = false;
    });

    it("should include timestamp in result", async () => {
      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(false);
      const prisma = createMockPrisma();

      const before = new Date();
      const result = await healthCheck(prisma);
      const after = new Date();

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("should list all providers with their status", async () => {
      const mockProvider = new ConsoleProvider({
        id: "provider-1",
        name: "Test Provider",
        type: "CONSOLE",
        fromName: "Test",
        fromEmail: "test@example.com",
      });

      const mockProviderService = {
        list: vi.fn().mockResolvedValue([{ id: "provider-1", name: "Test Provider", type: "CONSOLE" }]),
      };

      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (EmailFactory.getInstance as ReturnType<typeof vi.fn>).mockReturnValue({
        getProvider: vi.fn().mockResolvedValue(mockProvider),
        getProviderService: vi.fn().mockReturnValue(mockProviderService),
      });

      const prisma = createMockPrisma();
      const result = await healthCheck(prisma);

      expect(result.providers).toHaveLength(1);
      expect(result.providers[0]?.id).toBe("provider-1");
      expect(result.providers[0]?.name).toBe("Test Provider");
    });

    it("should report degraded status for provider test failure", async () => {
      const failingProvider = {
        id: "failing",
        name: "Failing Provider",
        type: "SMTP",
        fromEmail: "test@example.com",
        fromName: "Test",
        testConnection: vi.fn().mockResolvedValue({
          success: false,
          error: "Connection refused",
        }),
        send: vi.fn(),
      };

      const mockProviderService = {
        list: vi.fn().mockResolvedValue([]),
      };

      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (EmailFactory.getInstance as ReturnType<typeof vi.fn>).mockReturnValue({
        getProvider: vi.fn().mockResolvedValue(failingProvider),
        getProviderService: vi.fn().mockReturnValue(mockProviderService),
      });

      const prisma = createMockPrisma();
      const result = await healthCheck(prisma);

      expect(result.components.defaultProvider.status).toBe("degraded");
    });
  });

  describe("quickHealthCheck", () => {
    it("should return initialization status", () => {
      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (EmailQueue as unknown as { configured: boolean }).configured = false;

      const result = quickHealthCheck();

      expect(result.initialized).toBe(false);
      expect(result.queueConfigured).toBe(false);
    });

    it("should report initialized when factory is ready", () => {
      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const result = quickHealthCheck();

      expect(result.initialized).toBe(true);
    });

    it("should report queue configured when QStash is ready", () => {
      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (EmailQueue as unknown as { configured: boolean }).configured = true;

      const result = quickHealthCheck();

      expect(result.queueConfigured).toBe(true);

      // Reset
      (EmailQueue as unknown as { configured: boolean }).configured = false;
    });
  });

  describe("sendTestEmail", () => {
    it("should return error when not initialized", async () => {
      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const result = await sendTestEmail("test@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not initialized");
    });

    it("should send test email successfully", async () => {
      const mockProvider = new ConsoleProvider();

      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (EmailFactory.getInstance as ReturnType<typeof vi.fn>).mockReturnValue({
        getProvider: vi.fn().mockResolvedValue(mockProvider),
      });

      const result = await sendTestEmail("test@example.com");

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it("should use specific provider when ID is provided", async () => {
      const mockProvider = new ConsoleProvider();
      const mockGetProvider = vi.fn().mockResolvedValue(mockProvider);

      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (EmailFactory.getInstance as ReturnType<typeof vi.fn>).mockReturnValue({
        getProvider: mockGetProvider,
      });

      await sendTestEmail("test@example.com", "specific-provider");

      expect(mockGetProvider).toHaveBeenCalledWith("specific-provider");
    });

    it("should return error on send failure", async () => {
      const failingProvider = {
        ...new ConsoleProvider(),
        send: vi.fn().mockRejectedValue(new Error("Send failed")),
      };

      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (EmailFactory.getInstance as ReturnType<typeof vi.fn>).mockReturnValue({
        getProvider: vi.fn().mockResolvedValue(failingProvider),
      });

      const result = await sendTestEmail("test@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Send failed");
    });

    it("should handle unknown errors", async () => {
      (EmailFactory.isInitialized as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (EmailFactory.getInstance as ReturnType<typeof vi.fn>).mockReturnValue({
        getProvider: vi.fn().mockRejectedValue("Not an error object"),
      });

      const result = await sendTestEmail("test@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });
  });
});
