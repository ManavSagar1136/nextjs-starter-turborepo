/**
 * @buildbase/email - Error Classes Tests
 */

import { describe, it, expect } from "vitest";
import {
  EmailError,
  ProviderError,
  ProviderNotFoundError,
  ValidationError,
  ConfigurationError,
  EncryptionError,
  NoDefaultProviderError,
} from "../src/core/errors.js";

describe("Error Classes", () => {
  describe("EmailError", () => {
    it("should create with message and code", () => {
      const error = new EmailError("Test error", "TEST_CODE");

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.name).toBe("EmailError");
      expect(error.cause).toBeUndefined();
    });

    it("should create with cause", () => {
      const cause = new Error("Original error");
      const error = new EmailError("Test error", "TEST_CODE", cause);

      expect(error.cause).toBe(cause);
    });

    it("should be instanceof Error", () => {
      const error = new EmailError("Test", "CODE");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EmailError);
    });
  });

  describe("ProviderError", () => {
    it("should create with provider name", () => {
      const error = new ProviderError("Provider failed", "SMTP");

      expect(error.message).toBe("Provider failed");
      expect(error.code).toBe("PROVIDER_ERROR");
      expect(error.provider).toBe("SMTP");
      expect(error.name).toBe("ProviderError");
    });

    it("should create with cause", () => {
      const cause = new Error("Connection refused");
      const error = new ProviderError("Provider failed", "SMTP", cause);

      expect(error.cause).toBe(cause);
    });
  });

  describe("ProviderNotFoundError", () => {
    it("should create with provider ID", () => {
      const error = new ProviderNotFoundError("provider-123");

      expect(error.message).toBe("Email provider not found: provider-123");
      expect(error.code).toBe("PROVIDER_NOT_FOUND");
      expect(error.providerId).toBe("provider-123");
      expect(error.name).toBe("ProviderNotFoundError");
    });
  });

  describe("ValidationError", () => {
    it("should create with field name", () => {
      const error = new ValidationError("Invalid email", "to");

      expect(error.message).toBe("Invalid email");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.field).toBe("to");
      expect(error.name).toBe("ValidationError");
    });

    it("should create with field value", () => {
      const error = new ValidationError("Invalid email", "to", "not-an-email");

      expect(error.value).toBe("not-an-email");
    });
  });

  describe("ConfigurationError", () => {
    it("should create with message", () => {
      const error = new ConfigurationError("Missing API key");

      expect(error.message).toBe("Missing API key");
      expect(error.code).toBe("CONFIGURATION_ERROR");
      expect(error.name).toBe("ConfigurationError");
    });

    it("should create with key name", () => {
      const error = new ConfigurationError("Missing API key", "API_KEY");

      expect(error.key).toBe("API_KEY");
    });
  });

  describe("EncryptionError", () => {
    it("should create with message", () => {
      const error = new EncryptionError("Decryption failed");

      expect(error.message).toBe("Decryption failed");
      expect(error.code).toBe("ENCRYPTION_ERROR");
      expect(error.name).toBe("EncryptionError");
    });

    it("should create with cause", () => {
      const cause = new Error("Invalid key");
      const error = new EncryptionError("Decryption failed", cause);

      expect(error.cause).toBe(cause);
    });
  });

  describe("NoDefaultProviderError", () => {
    it("should create with default message", () => {
      const error = new NoDefaultProviderError();

      expect(error.message).toContain("No default email provider");
      expect(error.code).toBe("NO_DEFAULT_PROVIDER");
      expect(error.name).toBe("NoDefaultProviderError");
    });
  });
});
