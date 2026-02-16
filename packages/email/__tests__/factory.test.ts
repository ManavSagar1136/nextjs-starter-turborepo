/**
 * @buildbase/email - Email Factory Tests
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

import { EmailFactory } from "../src/factory/email.factory.js";
import { ConsoleProvider } from "../src/providers/console.provider.js";
import { NoDefaultProviderError, ProviderNotFoundError } from "../src/core/errors.js";
import type { EmailProvider as DbEmailProvider } from "@buildbase/database";

// Mock the encryption module
vi.mock("../src/core/encryption.js", () => ({
  decryptConfig: vi.fn((config: string) => {
    // Return mock config based on the encrypted string
    if (config === "encrypted_smtp") {
      return { host: "smtp.test.com", port: 587, username: "user", password: "pass" };
    }
    if (config === "encrypted_resend") {
      return { apiKey: "re_test_123" };
    }
    return {};
  }),
  encryptConfig: vi.fn((config: object) => JSON.stringify(config)),
}));

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: "smtp_123" }),
      verify: vi.fn().mockResolvedValue(true),
      close: vi.fn(),
    })),
  },
}));

// Mock resend
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "resend_123" }, error: null }),
    },
  })),
}));

// Create mock Prisma client
function createMockPrisma(providers: Partial<DbEmailProvider>[] = []) {
  return {
    emailProvider: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string } }) => {
        return providers.find(p => p.id === where.id) || null;
      }),
      findFirst: vi.fn(async ({ where }: { where: { isDefault?: boolean; isActive?: boolean } }) => {
        if (where.isDefault) {
          return providers.find(p => p.isDefault) || null;
        }
        if (where.isActive) {
          return providers.find(p => p.isActive) || null;
        }
        return providers[0] || null;
      }),
      findMany: vi.fn(async () => providers),
      update: vi.fn(),
      count: vi.fn(async () => providers.length),
    },
  } as unknown as Parameters<typeof EmailFactory.initialize>[0];
}

describe("EmailFactory", () => {
  beforeEach(() => {
    // Reset factory singleton
    (EmailFactory as unknown as { instance: null }).instance = null;
    vi.stubEnv("EMAIL_ENCRYPTION_KEY", Buffer.from("12345678901234567890123456789012").toString("base64"));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("initialize", () => {
    it("should initialize factory with Prisma client", () => {
      const prisma = createMockPrisma();
      const factory = EmailFactory.initialize(prisma);

      expect(factory).toBeDefined();
      expect(EmailFactory.isInitialized()).toBe(true);
    });

    it("should return same instance on multiple initializations", () => {
      const prisma = createMockPrisma();
      const factory1 = EmailFactory.initialize(prisma);
      const factory2 = EmailFactory.initialize(prisma);

      expect(factory1).toBe(factory2);
    });
  });

  describe("getInstance", () => {
    it("should throw if not initialized", () => {
      expect(() => EmailFactory.getInstance()).toThrow("not initialized");
    });

    it("should return factory instance after initialization", () => {
      const prisma = createMockPrisma();
      EmailFactory.initialize(prisma);

      const instance = EmailFactory.getInstance();
      expect(instance).toBeDefined();
    });
  });

  describe("isInitialized", () => {
    it("should return false before initialization", () => {
      expect(EmailFactory.isInitialized()).toBe(false);
    });

    it("should return true after initialization", () => {
      const prisma = createMockPrisma();
      EmailFactory.initialize(prisma);

      expect(EmailFactory.isInitialized()).toBe(true);
    });
  });

  describe("getProvider", () => {
    it("should return console provider when no providers configured", async () => {
      const prisma = createMockPrisma([]);
      EmailFactory.initialize(prisma);

      const provider = await EmailFactory.getInstance().getProvider();

      expect(provider).toBeInstanceOf(ConsoleProvider);
    });

    it("should return provider by ID", async () => {
      const mockProvider: Partial<DbEmailProvider> = {
        id: "provider-1",
        name: "Test SMTP",
        type: "SMTP",
        fromName: "Test",
        fromEmail: "test@example.com",
        config: "encrypted_smtp",
        isActive: true,
        isDefault: false,
      };

      const prisma = createMockPrisma([mockProvider]);
      EmailFactory.initialize(prisma);

      const provider = await EmailFactory.getInstance().getProvider("provider-1");

      expect(provider.id).toBe("provider-1");
      expect(provider.name).toBe("Test SMTP");
      expect(provider.type).toBe("SMTP");
    });

    it("should throw ProviderNotFoundError for unknown ID", async () => {
      const prisma = createMockPrisma([]);
      EmailFactory.initialize(prisma);

      await expect(EmailFactory.getInstance().getProvider("nonexistent")).rejects.toThrow(ProviderNotFoundError);
    });

    it("should return default provider when no ID specified", async () => {
      const mockProvider: Partial<DbEmailProvider> = {
        id: "default-provider",
        name: "Default SMTP",
        type: "SMTP",
        fromName: "Default",
        fromEmail: "default@example.com",
        config: "encrypted_smtp",
        isActive: true,
        isDefault: true,
      };

      const prisma = createMockPrisma([mockProvider]);
      EmailFactory.initialize(prisma);

      const provider = await EmailFactory.getInstance().getProvider();

      expect(provider.id).toBe("default-provider");
    });

    it("should cache provider instances", async () => {
      const mockProvider: Partial<DbEmailProvider> = {
        id: "cached-provider",
        name: "Cached SMTP",
        type: "SMTP",
        fromName: "Cached",
        fromEmail: "cached@example.com",
        config: "encrypted_smtp",
        isActive: true,
      };

      const prisma = createMockPrisma([mockProvider]);
      EmailFactory.initialize(prisma);

      const provider1 = await EmailFactory.getInstance().getProvider("cached-provider");
      const provider2 = await EmailFactory.getInstance().getProvider("cached-provider");

      expect(provider1).toBe(provider2);
    });
  });

  describe("getDefaultProvider", () => {
    it("should throw NoDefaultProviderError when no default configured", async () => {
      const prisma = createMockPrisma([
        {
          id: "provider-1",
          name: "Non-default",
          type: "SMTP",
          isDefault: false,
          config: "encrypted_smtp",
        },
      ]);
      EmailFactory.initialize(prisma);

      await expect(EmailFactory.getInstance().getDefaultProvider()).rejects.toThrow(NoDefaultProviderError);
    });

    it("should return default provider when configured", async () => {
      const mockProvider: Partial<DbEmailProvider> = {
        id: "default-provider",
        name: "Default Provider",
        type: "RESEND",
        fromName: "Default",
        fromEmail: "default@example.com",
        config: "encrypted_resend",
        isActive: true,
        isDefault: true,
      };

      const prisma = createMockPrisma([mockProvider]);
      EmailFactory.initialize(prisma);

      const provider = await EmailFactory.getInstance().getDefaultProvider();

      expect(provider.id).toBe("default-provider");
    });
  });

  describe("createFromDbRecord", () => {
    it("should create ConsoleProvider for CONSOLE type", async () => {
      const mockProvider: DbEmailProvider = {
        id: "console-1",
        name: "Console Provider",
        type: "CONSOLE",
        fromName: "Test",
        fromEmail: "test@example.com",
        replyTo: null,
        config: "",
        isActive: true,
        isDefault: false,
        emailsSent: 0,
        lastUsedAt: null,
        workspaceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      };

      const prisma = createMockPrisma();
      EmailFactory.initialize(prisma);

      const provider = await EmailFactory.getInstance().createFromDbRecord(mockProvider);

      expect(provider).toBeInstanceOf(ConsoleProvider);
      expect(provider.type).toBe("CONSOLE");
    });

    it("should create NodemailerProvider for SMTP type", async () => {
      const mockProvider: DbEmailProvider = {
        id: "smtp-1",
        name: "SMTP Provider",
        type: "SMTP",
        fromName: "Test",
        fromEmail: "test@example.com",
        replyTo: null,
        config: "encrypted_smtp",
        isActive: true,
        isDefault: false,
        emailsSent: 0,
        lastUsedAt: null,
        workspaceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      };

      const prisma = createMockPrisma();
      EmailFactory.initialize(prisma);

      const provider = await EmailFactory.getInstance().createFromDbRecord(mockProvider);

      expect(provider.type).toBe("SMTP");
      expect(provider.name).toBe("SMTP Provider");
    });

    it("should create ResendProvider for RESEND type", async () => {
      const mockProvider: DbEmailProvider = {
        id: "resend-1",
        name: "Resend Provider",
        type: "RESEND",
        fromName: "Test",
        fromEmail: "test@example.com",
        replyTo: null,
        config: "encrypted_resend",
        isActive: true,
        isDefault: false,
        emailsSent: 0,
        lastUsedAt: null,
        workspaceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      };

      const prisma = createMockPrisma();
      EmailFactory.initialize(prisma);

      const provider = await EmailFactory.getInstance().createFromDbRecord(mockProvider);

      expect(provider.type).toBe("RESEND");
    });

    it("should throw for unknown provider type", async () => {
      const mockProvider = {
        id: "unknown-1",
        name: "Unknown Provider",
        type: "UNKNOWN_TYPE",
        fromName: "Test",
        fromEmail: "test@example.com",
        replyTo: null,
        config: "",
        isActive: true,
        isDefault: false,
      } as unknown as DbEmailProvider;

      const prisma = createMockPrisma();
      EmailFactory.initialize(prisma);

      await expect(EmailFactory.getInstance().createFromDbRecord(mockProvider)).rejects.toThrow(
        "Unknown provider type"
      );
    });
  });

  describe("invalidateCache", () => {
    it("should invalidate specific provider cache", async () => {
      const mockProvider: Partial<DbEmailProvider> = {
        id: "cached-provider",
        name: "Cached Provider",
        type: "CONSOLE",
        fromName: "Test",
        fromEmail: "test@example.com",
        config: "",
        isActive: true,
      };

      const prisma = createMockPrisma([mockProvider]);
      EmailFactory.initialize(prisma);

      // Cache the provider
      await EmailFactory.getInstance().getProvider("cached-provider");

      // Invalidate cache
      EmailFactory.getInstance().invalidateCache("cached-provider");

      // Should fetch again from DB
      await EmailFactory.getInstance().getProvider("cached-provider");

      // Verify findUnique was called twice (cache miss after invalidation)
      expect(prisma.emailProvider.findUnique).toHaveBeenCalledTimes(2);
    });

    it("should invalidate all caches when no ID provided", async () => {
      const mockProviders: Partial<DbEmailProvider>[] = [
        {
          id: "provider-1",
          name: "Provider 1",
          type: "CONSOLE",
          config: "",
          isActive: true,
        },
        {
          id: "provider-2",
          name: "Provider 2",
          type: "CONSOLE",
          config: "",
          isActive: true,
        },
      ];

      const prisma = createMockPrisma(mockProviders);
      EmailFactory.initialize(prisma);

      // Cache both providers
      await EmailFactory.getInstance().getProvider("provider-1");
      await EmailFactory.getInstance().getProvider("provider-2");

      // Invalidate all
      EmailFactory.getInstance().invalidateCache();

      // Fetch again
      await EmailFactory.getInstance().getProvider("provider-1");
      await EmailFactory.getInstance().getProvider("provider-2");

      // Should have made 4 DB calls total
      expect(prisma.emailProvider.findUnique).toHaveBeenCalledTimes(4);
    });
  });

  describe("getProviderService", () => {
    it("should return provider service instance", () => {
      const prisma = createMockPrisma();
      EmailFactory.initialize(prisma);

      const providerService = EmailFactory.getInstance().getProviderService();

      expect(providerService).toBeDefined();
      expect(typeof providerService.findById).toBe("function");
      expect(typeof providerService.create).toBe("function");
      expect(typeof providerService.update).toBe("function");
      expect(typeof providerService.delete).toBe("function");
    });
  });
});
