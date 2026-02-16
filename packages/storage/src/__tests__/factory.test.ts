import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @buildbase/env to allow test environment variable control
// This creates a proxy that reads from process.env dynamically
// Must be hoisted (before any imports that use @buildbase/env)
vi.mock("@buildbase/env", () => {
  return {
    env: new Proxy({} as Record<string, string | undefined>, {
      get(_target, prop: string) {
        // Return process.env value, or undefined if not set
        return process.env[prop];
      },
    }),
    isDevelopment: () => process.env.NODE_ENV === "development",
    isProduction: () => process.env.NODE_ENV === "production",
    isTest: () => process.env.NODE_ENV === "test",
  };
});

import { StorageFactory } from "../factory";
import { getStorageProvider } from "../config";

describe("StorageFactory", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    StorageFactory.getInstance().clearCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = StorageFactory.getInstance();
      const instance2 = StorageFactory.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("getDefaultProviderType", () => {
    it("should return gcs as default", () => {
      // No STORAGE_PROVIDER set, should default to gcs
      const factory = StorageFactory.getInstance();
      expect(factory.getDefaultProviderType()).toBe("gcs");
    });

    it("should return configured provider", () => {
      vi.stubEnv("STORAGE_PROVIDER", "s3");
      const provider = getStorageProvider();
      expect(provider).toBe("s3");
    });
  });

  describe("getProvider", () => {
    it("should throw error for invalid provider", async () => {
      vi.stubEnv("STORAGE_PROVIDER", "invalid");
      await expect(async () => {
        const factory = StorageFactory.getInstance();
        await factory.getProvider();
      }).rejects.toThrow();
    });

    it("should throw error when GCS bucket not configured", async () => {
      vi.stubEnv("STORAGE_PROVIDER", "gcs");
      // Don't set GCS env vars - should throw error

      const factory = StorageFactory.getInstance();
      await expect(factory.getProvider()).rejects.toThrow("Missing required Google Cloud Storage configuration");
    });

    it("should throw error when S3 bucket not configured", async () => {
      vi.stubEnv("STORAGE_PROVIDER", "s3");
      // Don't set S3_BUCKET_NAME - should throw error

      const factory = StorageFactory.getInstance();
      await expect(factory.getProvider()).rejects.toThrow("S3_BUCKET_NAME is required");
    });

    it("should allow local provider without configuration", async () => {
      vi.stubEnv("STORAGE_PROVIDER", "local");
      vi.stubEnv("LOCAL_STORAGE_PATH", "/tmp/test-uploads");

      const factory = StorageFactory.getInstance();
      const provider = await factory.getProvider();
      expect(provider.type).toBe("local");
    });
  });

  describe("clearCache", () => {
    it("should clear cached providers", async () => {
      vi.stubEnv("STORAGE_PROVIDER", "local");
      vi.stubEnv("LOCAL_STORAGE_PATH", "/tmp/test-uploads");

      const factory = StorageFactory.getInstance();
      const provider1 = await factory.getProvider();
      factory.clearCache();
      const provider2 = await factory.getProvider();

      // They should be different instances after cache clear
      expect(provider1).not.toBe(provider2);
    });
  });
});

describe("getStorageProvider", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should return gcs as default", () => {
    // No STORAGE_PROVIDER set, should default to gcs
    expect(getStorageProvider()).toBe("gcs");
  });

  it("should return configured provider", () => {
    vi.stubEnv("STORAGE_PROVIDER", "s3");
    expect(getStorageProvider()).toBe("s3");
  });

  it("should throw for invalid provider", () => {
    vi.stubEnv("STORAGE_PROVIDER", "invalid");
    expect(() => getStorageProvider()).toThrow("Invalid STORAGE_PROVIDER");
  });
});
