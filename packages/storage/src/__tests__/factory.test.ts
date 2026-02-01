import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StorageFactory } from "../factory";
import { getStorageProvider } from "../config";

// Mock environment
const originalEnv = process.env;

describe("StorageFactory", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    StorageFactory.getInstance().clearCache();
  });

  afterEach(() => {
    process.env = originalEnv;
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
      delete process.env.STORAGE_PROVIDER;
      const factory = StorageFactory.getInstance();
      expect(factory.getDefaultProviderType()).toBe("gcs");
    });

    it("should return configured provider", () => {
      process.env.STORAGE_PROVIDER = "s3";
      const provider = getStorageProvider();
      expect(provider).toBe("s3");
    });
  });

  describe("getProvider", () => {
    it("should throw error for invalid provider", async () => {
      process.env.STORAGE_PROVIDER = "invalid" as any;
      await expect(async () => {
        const factory = StorageFactory.getInstance();
        await factory.getProvider();
      }).rejects.toThrow();
    });

    it("should throw error when GCS bucket not configured", async () => {
      process.env.STORAGE_PROVIDER = "gcs";
      delete process.env.GOOGLE_CLOUD_BUCKET_NAME;
      delete process.env.GOOGLE_CLOUD_PROJECT_ID;
      delete process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
      delete process.env.GOOGLE_CLOUD_PRIVATE_KEY;

      const factory = StorageFactory.getInstance();
      await expect(factory.getProvider()).rejects.toThrow("Missing required Google Cloud Storage configuration");
    });

    it("should throw error when S3 bucket not configured", async () => {
      process.env.STORAGE_PROVIDER = "s3";
      delete process.env.S3_BUCKET_NAME;

      const factory = StorageFactory.getInstance();
      await expect(factory.getProvider()).rejects.toThrow("S3_BUCKET_NAME is required");
    });

    it("should allow local provider without configuration", async () => {
      process.env.STORAGE_PROVIDER = "local";
      process.env.LOCAL_STORAGE_PATH = "/tmp/test-uploads";

      const factory = StorageFactory.getInstance();
      const provider = await factory.getProvider();
      expect(provider.type).toBe("local");
    });
  });

  describe("clearCache", () => {
    it("should clear cached providers", async () => {
      process.env.STORAGE_PROVIDER = "local";
      process.env.LOCAL_STORAGE_PATH = "/tmp/test-uploads";

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
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return gcs as default", () => {
    delete process.env.STORAGE_PROVIDER;
    expect(getStorageProvider()).toBe("gcs");
  });

  it("should return configured provider", () => {
    process.env.STORAGE_PROVIDER = "s3";
    expect(getStorageProvider()).toBe("s3");
  });

  it("should throw for invalid provider", () => {
    process.env.STORAGE_PROVIDER = "invalid";
    expect(() => getStorageProvider()).toThrow("Invalid STORAGE_PROVIDER");
  });
});
