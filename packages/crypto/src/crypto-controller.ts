import crypto from "crypto";

import { DecryptionError, InvalidKeyError, TokenError } from "./errors.js";
import type {
  ApiKey,
  CacheEncryptionOptions,
  CryptoAlgorithm,
  CryptoConfig,
  CryptoOptions,
  EncryptedCacheEntry,
  EncryptedData,
  HashResult,
  HmacSigner,
  TokenPayload,
} from "./types.js";

// Key byte requirements per algorithm
const KEY_LENGTHS: Partial<Record<CryptoAlgorithm, number>> = {
  "aes-256-gcm": 32,
  "aes-192-gcm": 24,
  "aes-128-gcm": 16,
  "aes-256-cbc": 32,
  "aes-192-cbc": 24,
  "aes-128-cbc": 16,
};

const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /credential/i,
  /auth/i,
  /access/i,
  /refresh/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /session[_-]?id/i,
  /jwt/i,
  /bearer/i,
];

function resolveKey(key: string | undefined): string {
  if (key) return key;
  const envKey = process.env.SECRET_ENCRYPTION_KEY;
  if (envKey) return envKey;
  throw new InvalidKeyError(
    "[cms/crypto] No encryption key provided.\n" +
      "  Option A: new CryptoController({ key: 'your-64-char-hex-key' })\n" +
      "  Option B: set SECRET_ENCRYPTION_KEY env var\n" +
      "  Generate a key: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}

function normalizeKey(raw: string): Buffer {
  // 64-char hex string → 32-byte buffer; "0x"-prefixed hex; otherwise treat as UTF-8
  return raw.startsWith("0x") || raw.length === 64
    ? Buffer.from(raw.replace(/^0x/, ""), "hex")
    : Buffer.from(raw, "utf8");
}

function validateKeyBuffer(buf: Buffer, algorithm: string): void {
  const required = KEY_LENGTHS[algorithm as CryptoAlgorithm];
  if (required && buf.length !== required) {
    throw new InvalidKeyError(
      `[cms/crypto] Invalid key length for ${algorithm}: need ${required} bytes, got ${buf.length}.\n` +
        `  Provide a ${required * 2}-character hex string or a ${required}-byte UTF-8 string.`
    );
  }
}

function gcmAuthTag(cipher: crypto.Cipher): Buffer {
  return (cipher as crypto.CipherGCM).getAuthTag();
}

export class CryptoController {
  private readonly algorithm: string;
  private readonly key: string;
  private readonly keyBuffer: Buffer;
  private readonly ivLength: number;
  private readonly saltRounds: number;
  private readonly hashAlgorithm: string;
  private readonly hmacAlgorithm: string;

  private static readonly DEFAULT_ALGORITHM: CryptoAlgorithm = "aes-256-gcm";
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_ROUNDS = 10000;
  private static readonly DEFAULT_HASH_ALGORITHM = "sha256";
  private static readonly DEFAULT_HMAC_ALGORITHM = "sha256";

  constructor(config: CryptoConfig = {}) {
    this.algorithm = config.algorithm ?? CryptoController.DEFAULT_ALGORITHM;
    this.key = resolveKey(config.key);
    this.keyBuffer = normalizeKey(this.key);
    validateKeyBuffer(this.keyBuffer, this.algorithm);
    this.ivLength = config.ivLength ?? CryptoController.IV_LENGTH;
    this.saltRounds = config.saltRounds ?? CryptoController.SALT_ROUNDS;
    this.hashAlgorithm = config.hashAlgorithm ?? CryptoController.DEFAULT_HASH_ALGORITHM;
    this.hmacAlgorithm = config.hmacAlgorithm ?? CryptoController.DEFAULT_HMAC_ALGORITHM;
  }

  // ==================== STATIC FACTORIES ====================

  static encrypt(text: string, options: CryptoOptions = {}): string {
    return new CryptoController({ algorithm: options.algorithm, key: options.key }).encrypt(text);
  }

  static decrypt(data: string, options: CryptoOptions = {}): string {
    return new CryptoController({ algorithm: options.algorithm, key: options.key }).decrypt(data);
  }

  static async encryptForCache(data: unknown, options: CryptoOptions = {}): Promise<EncryptedCacheEntry> {
    const algorithm = options.algorithm ?? CryptoController.DEFAULT_ALGORITHM;
    const key = resolveKey(options.key);
    const encoding = options.encoding ?? "hex";
    const keyBuffer = normalizeKey(key);
    validateKeyBuffer(keyBuffer, algorithm);

    const iv = crypto.randomBytes(CryptoController.IV_LENGTH);
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
    let encrypted = cipher.update(JSON.stringify(data), "utf8", encoding);
    encrypted += cipher.final(encoding);

    const isGcm = algorithm.endsWith("-gcm");
    const authTag = isGcm ? (cipher as crypto.CipherGCM).getAuthTag() : null;

    return {
      encrypted: true,
      data: encrypted,
      iv: iv.toString("hex"),
      algorithm,
      ...(authTag && { authTag: authTag.toString("hex") }),
    };
  }

  static async decryptFromCache(entry: EncryptedCacheEntry, options: CryptoOptions = {}): Promise<unknown> {
    const algorithm = options.algorithm ?? entry.algorithm;
    const key = resolveKey(options.key);
    const encoding = options.encoding ?? "hex";
    const keyBuffer = normalizeKey(key);
    validateKeyBuffer(keyBuffer, algorithm);

    const iv = Buffer.from(entry.iv, "hex");
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);

    if (entry.authTag) {
      (decipher as crypto.DecipherGCM).setAuthTag(Buffer.from(entry.authTag, "hex"));
    }

    let decrypted = decipher.update(entry.data, encoding, "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted) as unknown;
  }

  // Produces a reusable signer/verifier bound to a fixed secret — ideal for webhooks
  static createHmacSigner(secret: string, algorithm = "sha256"): HmacSigner {
    const sign = (payload: string): string => crypto.createHmac(algorithm, secret).update(payload).digest("hex");

    const verify = (payload: string, signature: string): boolean => {
      try {
        const expected = sign(payload);
        const sigBuf = Buffer.from(signature, "hex");
        const expBuf = Buffer.from(expected, "hex");
        if (sigBuf.length !== expBuf.length) return false;
        return crypto.timingSafeEqual(sigBuf, expBuf);
      } catch {
        return false;
      }
    };

    return { sign, verify };
  }

  static shouldEncrypt(key: string, data: unknown, options: CacheEncryptionOptions = {}): boolean {
    if (options.encrypt === false) return false;
    if (options.encrypt === true) return true;
    if (SENSITIVE_PATTERNS.some(p => p.test(key))) return true;
    if (options.encryptSensitive && typeof data === "object" && data !== null) {
      if (SENSITIVE_PATTERNS.some(p => p.test(JSON.stringify(data)))) return true;
    }
    return false;
  }

  static isEncryptedCacheEntry(data: unknown): data is EncryptedCacheEntry {
    return (
      typeof data === "object" &&
      data !== null &&
      (data as EncryptedCacheEntry).encrypted === true &&
      typeof (data as EncryptedCacheEntry).data === "string" &&
      typeof (data as EncryptedCacheEntry).iv === "string" &&
      typeof (data as EncryptedCacheEntry).algorithm === "string"
    );
  }

  static generateSecureString(length = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  static hashString(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  static isValidEncryptionKey(key: string): boolean {
    return /^[0-9a-fA-F]{64}$/.test(key);
  }

  // ==================== SYMMETRIC ENCRYPTION ====================

  encrypt(data: string | Buffer): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.keyBuffer, iv);
    const input = typeof data === "string" ? Buffer.from(data, "utf8") : data;
    const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
    const isGcm = this.algorithm.endsWith("-gcm");

    const result: EncryptedData = {
      iv: iv.toString("hex"),
      tag: isGcm ? gcmAuthTag(cipher).toString("hex") : "",
      encrypted: encrypted.toString("hex"),
      algorithm: this.algorithm,
      timestamp: Date.now(),
    };
    return JSON.stringify(result);
  }

  decrypt(encryptedData: string): string {
    let parsed: EncryptedData;
    try {
      parsed = JSON.parse(encryptedData) as EncryptedData;
    } catch (cause) {
      throw new DecryptionError("Ciphertext is not valid JSON", cause);
    }

    try {
      const iv = Buffer.from(parsed.iv, "hex");
      const encrypted = Buffer.from(parsed.encrypted, "hex");
      const decipher = crypto.createDecipheriv(parsed.algorithm || this.algorithm, this.keyBuffer, iv);
      if (parsed.tag) {
        (decipher as crypto.DecipherGCM).setAuthTag(Buffer.from(parsed.tag, "hex"));
      }
      return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    } catch (cause) {
      throw new DecryptionError("Decryption failed — wrong key or corrupted ciphertext", cause);
    }
  }

  isEncrypted(data: string): boolean {
    try {
      const p = JSON.parse(data) as Record<string, unknown>;
      return (
        typeof p === "object" &&
        p !== null &&
        typeof p.iv === "string" &&
        typeof p.encrypted === "string" &&
        typeof p.algorithm === "string" &&
        typeof p.timestamp === "number"
      );
    } catch {
      return false;
    }
  }

  // ==================== OBJECT ENCRYPTION ====================

  // Encrypts an entire object as a single ciphertext blob
  encryptObject<T extends Record<string, unknown>>(obj: T): string {
    return this.encrypt(JSON.stringify(obj));
  }

  // Decrypts a blob produced by encryptObject
  decryptObject<T extends Record<string, unknown>>(ciphertext: string): T {
    return JSON.parse(this.decrypt(ciphertext)) as T;
  }

  // Encrypts specific fields of an object in-place (shallow copy); non-string values are JSON-serialized
  encryptFields<T extends Record<string, unknown>>(obj: T, fields: ReadonlyArray<keyof T>): T {
    const result = { ...obj };
    for (const field of fields) {
      const value = result[field];
      if (value === undefined || value === null) continue;
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      (result as Record<string, unknown>)[field as string] = this.encrypt(serialized);
    }
    return result;
  }

  // Decrypts fields previously encrypted by encryptFields; restores original type via JSON.parse where applicable
  decryptFields<T extends Record<string, unknown>>(obj: T, fields: ReadonlyArray<keyof T>): T {
    const result = { ...obj };
    for (const field of fields) {
      const value = result[field];
      if (typeof value !== "string" || !this.isEncrypted(value)) continue;
      const plain = this.decrypt(value);
      try {
        (result as Record<string, unknown>)[field as string] = JSON.parse(plain) as unknown;
      } catch {
        (result as Record<string, unknown>)[field as string] = plain;
      }
    }
    return result;
  }

  // Re-encrypts a ciphertext under a new key — use for key rotation
  reEncrypt(encryptedData: string, newController: CryptoController): string {
    return newController.encrypt(this.decrypt(encryptedData));
  }

  // ==================== WORKSPACE-SCOPED ENCRYPTION ====================
  // Derives a workspace-specific 32-byte key via HMAC-SHA256 so that a
  // compromise of one workspace's ciphertext cannot be used to attack others.

  private deriveWorkspaceKey(workspaceId: string): Buffer {
    return crypto.createHmac("sha256", this.keyBuffer).update(`workspace:${workspaceId}`).digest();
  }

  encryptForWorkspace(plaintext: string, workspaceId: string): string {
    const derived = this.deriveWorkspaceKey(workspaceId);
    const ctrl = new CryptoController({ key: derived.toString("hex") });
    return ctrl.encrypt(plaintext);
  }

  decryptForWorkspace(ciphertext: string, workspaceId: string): string {
    const derived = this.deriveWorkspaceKey(workspaceId);
    const ctrl = new CryptoController({ key: derived.toString("hex") });
    return ctrl.decrypt(ciphertext);
  }

  // ==================== HASHING ====================

  hash(data: string, algorithm = this.hashAlgorithm): string {
    return crypto.createHash(algorithm).update(data).digest("hex");
  }

  sha256(data: string): string {
    return this.hash(data, "sha256");
  }
  sha512(data: string): string {
    return this.hash(data, "sha512");
  }
  md5(data: string): string {
    return this.hash(data, "md5");
  }

  // ==================== HMAC ====================

  hmac(data: string, secret = this.key, algorithm = this.hmacAlgorithm): string {
    return crypto.createHmac(algorithm, secret).update(data).digest("hex");
  }

  verifyHmac(data: string, signature: string, secret = this.key, algorithm = this.hmacAlgorithm): boolean {
    try {
      const expected = this.hmac(data, secret, algorithm);
      const sigBuf = Buffer.from(signature, "hex");
      const expBuf = Buffer.from(expected, "hex");
      // Length must match before timingSafeEqual to avoid throwing
      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }

  // ==================== PASSWORD HASHING ====================

  hashPassword(password: string): HashResult {
    const salt = crypto.randomBytes(32).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, this.saltRounds, 64, this.hashAlgorithm).toString("hex");
    return { hash, salt, algorithm: this.hashAlgorithm };
  }

  verifyPassword(password: string, hashResult: HashResult): boolean {
    const { hash, salt, algorithm } = hashResult;
    const computed = crypto.pbkdf2Sync(password, salt, this.saltRounds, 64, algorithm).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computed, "hex"));
  }

  // ==================== API KEY MANAGEMENT ====================

  // Generates an API key with a human-readable prefix, stores only the SHA-256 hash
  generateApiKey(prefix = "sk"): ApiKey {
    const raw = `${prefix}_${this.randomHex(32)}`;
    return {
      raw,
      hash: this.sha256(raw),
      prefix: raw.slice(0, prefix.length + 3), // e.g. "sk_ab" — safe to display
    };
  }

  // Validates an incoming raw API key against a stored hash
  verifyApiKey(raw: string, storedHash: string): boolean {
    const computed = this.sha256(raw);
    try {
      return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(storedHash, "hex"));
    } catch {
      return false;
    }
  }

  // ==================== TOKEN GENERATION ====================

  generateToken<T = unknown>(data: T, expiresIn = 3600000): string {
    const payload: TokenPayload<T> = {
      data,
      iat: Date.now(),
      exp: Date.now() + expiresIn,
      iss: "cms-crypto",
    };
    const json = JSON.stringify(payload);
    const signature = this.hmac(json);
    return Buffer.from(`${json}.${signature}`).toString("base64url");
  }

  verifyToken<T = unknown>(token: string): TokenPayload<T> | null {
    try {
      const decoded = Buffer.from(token, "base64url").toString("utf8");
      const dotIndex = decoded.lastIndexOf(".");
      if (dotIndex < 0) return null;

      const json = decoded.slice(0, dotIndex);
      const signature = decoded.slice(dotIndex + 1);

      if (!this.verifyHmac(json, signature)) return null;

      const payload = JSON.parse(json) as TokenPayload<T>;
      if (payload.exp && Date.now() > payload.exp) return null;

      return payload;
    } catch (cause) {
      throw new TokenError("Token verification failed", cause);
    }
  }

  // ==================== KEY DERIVATION ====================

  deriveKey(password: string, salt: string, iterations = this.saltRounds, keyLength = 32): Buffer {
    return crypto.pbkdf2Sync(password, salt, iterations, keyLength, this.hashAlgorithm);
  }

  generateKeyPair(
    type: "rsa" | "ec" | "ed25519" | "ed448" | "x25519" | "x448" | "dh" = "rsa",
    options: Record<string, unknown> = {}
  ): { publicKey: string; privateKey: string } {
    const defaultOptions =
      type === "rsa"
        ? {
            modulusLength: 2048,
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
          }
        : {
            namedCurve: "secp256k1",
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "sec1", format: "pem" },
          };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return crypto.generateKeyPairSync(type as any, { ...defaultOptions, ...options } as any) as {
      publicKey: string;
      privateKey: string;
    };
  }

  // ==================== RANDOM GENERATION ====================

  randomBytes(length: number): Buffer {
    return crypto.randomBytes(length);
  }

  randomString(length: number, charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"): string {
    const bytes = this.randomBytes(length);
    let result = "";
    for (let i = 0; i < length; i++) {
      result += charset[bytes[i]! % charset.length];
    }
    return result;
  }

  randomHex(length: number): string {
    return this.randomBytes(Math.ceil(length / 2))
      .toString("hex")
      .slice(0, length);
  }

  uuid(): string {
    return crypto.randomUUID();
  }

  // ==================== DATA MASKING ====================

  makePreview(value: string, prefix = 5, suffix = 3, mask = "******"): string {
    if (value.length <= prefix + suffix) return value;
    return `${value.slice(0, prefix)}${mask}${value.slice(-suffix)}`;
  }

  mask(value: string, maskChar = "*"): string {
    return maskChar.repeat(value.length);
  }

  maskEmail(email: string): string {
    const atIndex = email.indexOf("@");
    if (atIndex < 0) return email;
    const local = email.slice(0, atIndex);
    const domain = email.slice(atIndex + 1);
    if (local.length <= 2) return email;
    return `${local.slice(0, 2)}***@${domain}`;
  }

  maskPhone(phone: string): string {
    if (phone.length <= 4) return phone;
    return `${phone.slice(0, 2)}***${phone.slice(-2)}`;
  }

  // ==================== BASE64 UTILITIES ====================

  toBase64(data: string): string {
    return Buffer.from(data, "utf8").toString("base64");
  }
  fromBase64(data: string): string {
    return Buffer.from(data, "base64").toString("utf8");
  }
  toBase64Url(data: string): string {
    return Buffer.from(data, "utf8").toString("base64url");
  }
  fromBase64Url(data: string): string {
    return Buffer.from(data, "base64url").toString("utf8");
  }

  getInfo(): CryptoConfig & { key: string } {
    return {
      algorithm: this.algorithm as CryptoAlgorithm,
      ivLength: this.ivLength,
      saltRounds: this.saltRounds,
      hashAlgorithm: this.hashAlgorithm as NonNullable<CryptoConfig["hashAlgorithm"]>,
      hmacAlgorithm: this.hmacAlgorithm as NonNullable<CryptoConfig["hmacAlgorithm"]>,
      key: "[redacted]",
    };
  }
}
