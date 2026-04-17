/**
 * @buildbase/email - Encryption Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

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

import { encrypt, decrypt, encryptConfig, decryptConfig, generateEncryptionKey } from "../src/core/encryption.js";
import { ConfigurationError, EncryptionError } from "../src/core/errors.js";

describe("Encryption", () => {
  // Valid 64-char hex key for testing (32 bytes)
  const VALID_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  beforeEach(() => {
    vi.stubEnv("EMAIL_ENCRYPTION_KEY", VALID_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("encrypt/decrypt", () => {
    it("should encrypt and decrypt a string successfully", () => {
      const plaintext = "Hello, World!";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should encrypt to different ciphertext each time (random IV)", () => {
      const plaintext = "Same text";
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should decrypt both to same plaintext", () => {
      const plaintext = "Same text";
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(decrypt(encrypted1)).toBe(plaintext);
      expect(decrypt(encrypted2)).toBe(plaintext);
    });

    it("should handle empty strings", () => {
      const plaintext = "";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle unicode characters", () => {
      const plaintext = "Hello 世界 🌍 émojis";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle long strings", () => {
      const plaintext = "a".repeat(10000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should throw ConfigurationError when key is missing", () => {
      vi.stubEnv("EMAIL_ENCRYPTION_KEY", "");

      expect(() => encrypt("test")).toThrow(ConfigurationError);
    });

    it("should throw ConfigurationError when key is wrong length", () => {
      vi.stubEnv("EMAIL_ENCRYPTION_KEY", "shortkey");

      expect(() => encrypt("test")).toThrow(ConfigurationError);
      expect(() => encrypt("test")).toThrow("32-byte");
    });

    it("should throw EncryptionError for invalid ciphertext", () => {
      expect(() => decrypt("invalid-base64!!!")).toThrow(EncryptionError);
    });

    it("should throw EncryptionError for non-JSON ciphertext", () => {
      const nonJson = Buffer.from("short").toString("base64");
      expect(() => decrypt(nonJson)).toThrow(EncryptionError);
      expect(() => decrypt(nonJson)).toThrow("not valid JSON");
    });

    it("should throw EncryptionError for tampered ciphertext", () => {
      const encrypted = encrypt("test");
      const tampered = encrypted.slice(0, -4) + "XXXX";

      expect(() => decrypt(tampered)).toThrow(EncryptionError);
    });
  });

  describe("encryptConfig/decryptConfig", () => {
    it("should encrypt and decrypt config objects", () => {
      const config = {
        apiKey: "sk_test_123",
        host: "smtp.example.com",
        port: 587,
        secure: true,
      };

      const encrypted = encryptConfig(config);
      const decrypted = decryptConfig<typeof config>(encrypted);

      expect(decrypted).toEqual(config);
    });

    it("should handle nested objects", () => {
      const config = {
        credentials: {
          username: "user",
          password: "secret",
        },
        options: {
          timeout: 5000,
          retries: 3,
        },
      };

      const encrypted = encryptConfig(config);
      const decrypted = decryptConfig<typeof config>(encrypted);

      expect(decrypted).toEqual(config);
    });

    it("should handle arrays in config", () => {
      const config = {
        hosts: ["smtp1.example.com", "smtp2.example.com"],
        ports: [587, 465],
      };

      const encrypted = encryptConfig(config);
      const decrypted = decryptConfig<typeof config>(encrypted);

      expect(decrypted).toEqual(config);
    });
  });

  describe("generateEncryptionKey", () => {
    it("should generate a valid 64-char hex key", () => {
      const key = generateEncryptionKey();

      expect(key).toMatch(/^[0-9a-f]{64}$/);
    });

    it("should generate different keys each time", () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });

    it("should generate keys that work with encrypt/decrypt", () => {
      const key = generateEncryptionKey();
      vi.stubEnv("EMAIL_ENCRYPTION_KEY", key);

      const plaintext = "test with generated key";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });
});
