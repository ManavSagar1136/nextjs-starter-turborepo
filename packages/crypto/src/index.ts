export { CryptoController } from "./crypto-controller.js";
export type {
  CacheEncryptionOptions,
  CryptoConfig,
  CryptoOptions,
  EncryptedCacheEntry,
  EncryptedData,
  HashResult,
  TokenPayload,
} from "./types.js";

import { CryptoController } from "./crypto-controller.js";

// Static utilities — no key or instance needed
export const generateEncryptionKey = (): string => CryptoController.generateEncryptionKey();

export const isValidEncryptionKey = (key: string): boolean => CryptoController.isValidEncryptionKey(key);

export const generateSecureString = (length?: number): string => CryptoController.generateSecureString(length);

export const hashString = (data: string): string => CryptoController.hashString(data);

export const shouldEncrypt = CryptoController.shouldEncrypt.bind(CryptoController);
export const isEncryptedCacheEntry = CryptoController.isEncryptedCacheEntry.bind(CryptoController);
