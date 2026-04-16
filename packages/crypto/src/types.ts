export type CryptoAlgorithm =
  | "aes-256-gcm"
  | "aes-192-gcm"
  | "aes-128-gcm"
  | "aes-256-cbc"
  | "aes-192-cbc"
  | "aes-128-cbc";

export type HashAlgorithm = "sha256" | "sha512" | "sha1" | "md5";

export interface CryptoConfig {
  algorithm?: CryptoAlgorithm;
  key?: string;
  ivLength?: number;
  saltRounds?: number;
  hashAlgorithm?: HashAlgorithm;
  hmacAlgorithm?: HashAlgorithm;
}

export interface EncryptedData {
  iv: string;
  tag: string;
  encrypted: string;
  algorithm: string;
  timestamp: number;
}

export interface EncryptedCacheEntry {
  encrypted: boolean;
  data: string;
  iv: string;
  algorithm: string;
  authTag?: string;
}

export interface HashResult {
  hash: string;
  salt: string;
  algorithm: string;
}

export interface TokenPayload<T = unknown> {
  data: T;
  exp?: number;
  iat?: number;
  iss?: string;
}

export interface CryptoOptions {
  algorithm?: CryptoAlgorithm;
  key?: string;
  encoding?: "hex" | "base64";
}

export interface CacheEncryptionOptions extends CryptoOptions {
  encrypt?: boolean;
  encryptSensitive?: boolean;
  accessControl?: boolean;
  userContext?: string;
}

export interface HmacSigner {
  sign: (payload: string) => string;
  verify: (payload: string, signature: string) => boolean;
}

export interface ApiKey {
  raw: string;
  hash: string;
  prefix: string;
}
