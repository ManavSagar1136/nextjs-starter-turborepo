export { CryptoController } from "./crypto-controller.js";
export { CryptoError, DecryptionError, InvalidKeyError, TokenError } from "./errors.js";
export type {
  ApiKey,
  CacheEncryptionOptions,
  CryptoAlgorithm,
  CryptoConfig,
  CryptoOptions,
  EncryptedCacheEntry,
  EncryptedData,
  HashAlgorithm,
  HashResult,
  HmacSigner,
  TokenPayload,
} from "./types.js";

import { CryptoController } from "./crypto-controller.js";

// Static utilities — no instance or key required
export const generateEncryptionKey = (): string => CryptoController.generateEncryptionKey();
export const isValidEncryptionKey = (key: string): boolean => CryptoController.isValidEncryptionKey(key);
export const generateSecureString = (length?: number): string => CryptoController.generateSecureString(length);
export const hashString = (data: string): string => CryptoController.hashString(data);
export const shouldEncrypt = CryptoController.shouldEncrypt.bind(CryptoController);
export const isEncryptedCacheEntry = CryptoController.isEncryptedCacheEntry.bind(CryptoController);
export const createHmacSigner = CryptoController.createHmacSigner.bind(CryptoController);
