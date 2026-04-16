import { CryptoController, generateEncryptionKey as genKey } from "@buildbase/crypto";
import { env } from "@buildbase/env";

import { ConfigurationError } from "./errors.js";

function getController(): CryptoController {
  const key = env.EMAIL_ENCRYPTION_KEY;
  if (!key) {
    throw new ConfigurationError(
      "EMAIL_ENCRYPTION_KEY is required for encrypting provider credentials.\n" +
        "  Generate with: openssl rand -hex 32",
      "EMAIL_ENCRYPTION_KEY"
    );
  }
  return new CryptoController({ key });
}

export function encrypt(plaintext: string): string {
  return getController().encrypt(plaintext);
}

export function decrypt(ciphertext: string): string {
  return getController().decrypt(ciphertext);
}

export function encryptConfig(config: Record<string, unknown>): string {
  return getController().encryptObject(config);
}

export function decryptConfig<T extends Record<string, unknown>>(encrypted: string): T {
  return getController().decryptObject<T>(encrypted);
}

// Returns a new 64-char hex key suitable for EMAIL_ENCRYPTION_KEY
export function generateEncryptionKey(): string {
  return genKey();
}
