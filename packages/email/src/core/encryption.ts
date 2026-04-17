import { CryptoController, DecryptionError, InvalidKeyError, generateEncryptionKey as genKey } from "@buildbase/crypto";
import { env } from "@buildbase/env";

import { ConfigurationError, EncryptionError } from "./errors.js";

function getController(): CryptoController {
  const key = env.EMAIL_ENCRYPTION_KEY;
  if (!key) {
    throw new ConfigurationError(
      "EMAIL_ENCRYPTION_KEY is required for encrypting provider credentials.\n" +
        "  Generate with: openssl rand -hex 32",
      "EMAIL_ENCRYPTION_KEY"
    );
  }
  try {
    return new CryptoController({ key });
  } catch (err) {
    if (err instanceof InvalidKeyError) {
      throw new ConfigurationError(err.message, "EMAIL_ENCRYPTION_KEY");
    }
    throw err;
  }
}

export function encrypt(plaintext: string): string {
  return getController().encrypt(plaintext);
}

export function decrypt(ciphertext: string): string {
  try {
    return getController().decrypt(ciphertext);
  } catch (err) {
    if (err instanceof ConfigurationError) throw err;
    if (err instanceof DecryptionError) throw new EncryptionError(err.message, err);
    throw new EncryptionError("Decryption failed", err instanceof Error ? err : undefined);
  }
}

export function encryptConfig(config: Record<string, unknown>): string {
  return getController().encryptObject(config);
}

export function decryptConfig<T extends Record<string, unknown>>(encrypted: string): T {
  try {
    return getController().decryptObject<T>(encrypted);
  } catch (err) {
    if (err instanceof ConfigurationError) throw err;
    if (err instanceof DecryptionError) throw new EncryptionError(err.message, err);
    throw new EncryptionError("Decryption failed", err instanceof Error ? err : undefined);
  }
}

// Returns a new 64-char hex key suitable for EMAIL_ENCRYPTION_KEY
export function generateEncryptionKey(): string {
  return genKey();
}
