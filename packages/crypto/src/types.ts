export interface CryptoConfig {
  algorithm?: string;
  key?: string;
  ivLength?: number;
  saltRounds?: number;
  hashAlgorithm?: string;
  hmacAlgorithm?: string;
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

export interface TokenPayload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  exp?: number;
  iat?: number;
  iss?: string;
}

export interface CryptoOptions {
  algorithm?: string;
  key?: string;
  encoding?: "hex" | "base64";
}

export interface CacheEncryptionOptions extends CryptoOptions {
  encrypt?: boolean;
  encryptSensitive?: boolean;
  accessControl?: boolean;
  userContext?: string;
}
