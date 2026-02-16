/**
 * @buildbase/email - Encryption Service
 * AES-256-GCM encryption for provider credentials
 */

import { env } from "@buildbase/env";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { ENCRYPTION_ALGORITHM, IV_LENGTH, AUTH_TAG_LENGTH } from "./constants.js";
import { ConfigurationError, EncryptionError } from "./errors.js";

/**
 * Get the encryption key from environment
 * Key must be 32 bytes (256 bits) base64-encoded
 */
export function getEncryptionKey(): Buffer {
  const key = env.EMAIL_ENCRYPTION_KEY;

  if (!key) {
    throw new ConfigurationError(
      "EMAIL_ENCRYPTION_KEY environment variable is required for encrypting provider credentials",
      "EMAIL_ENCRYPTION_KEY"
    );
  }

  const keyBuffer = Buffer.from(key, "base64");

  if (keyBuffer.length !== 32) {
    throw new ConfigurationError(
      "EMAIL_ENCRYPTION_KEY must be a 32-byte (256-bit) key encoded in base64. " +
        `Got ${keyBuffer.length} bytes. ` +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
      "EMAIL_ENCRYPTION_KEY"
    );
  }

  return keyBuffer;
}

/**
 * Encrypt a plaintext string
 * Returns base64-encoded string containing: iv + authTag + ciphertext
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Combine: iv (16) + authTag (16) + encrypted
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, "base64")]);

    return combined.toString("base64");
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }
    throw new EncryptionError("Failed to encrypt data", error instanceof Error ? error : undefined);
  }
}

/**
 * Decrypt a ciphertext string
 * Expects base64-encoded string containing: iv + authTag + ciphertext
 */
export function decrypt(ciphertext: string): string {
  try {
    const key = getEncryptionKey();
    const data = Buffer.from(ciphertext, "base64");

    if (data.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new EncryptionError("Invalid encrypted data: too short");
    }

    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  } catch (error) {
    if (error instanceof ConfigurationError || error instanceof EncryptionError) {
      throw error;
    }
    throw new EncryptionError(
      "Failed to decrypt data. The encryption key may have changed or data is corrupted.",
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Encrypt a config object
 */
export function encryptConfig(config: Record<string, unknown>): string {
  return encrypt(JSON.stringify(config));
}

/**
 * Decrypt a config object
 */
export function decryptConfig<T extends Record<string, unknown>>(encrypted: string): T {
  const decrypted = decrypt(encrypted);
  try {
    return JSON.parse(decrypted) as T;
  } catch {
    throw new EncryptionError("Failed to parse decrypted config as JSON");
  }
}

/**
 * Generate a new encryption key (utility for setup)
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString("base64");
}
