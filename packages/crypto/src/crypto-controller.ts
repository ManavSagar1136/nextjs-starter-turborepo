import crypto from "crypto";

import type {
  CacheEncryptionOptions,
  CryptoConfig,
  CryptoOptions,
  EncryptedCacheEntry,
  EncryptedData,
  HashResult,
  TokenPayload,
} from "./types.js";

function resolveKey(key: string | undefined): string {
  if (key) return key;
  const envKey = process.env.SECRET_ENCRYPTION_KEY;
  if (envKey) return envKey;
  throw new Error(
    "[cms/crypto] No encryption key provided.\n" +
      "  Pass a key to the constructor: new CryptoController({ key: '...' })\n" +
      "  Or set the SECRET_ENCRYPTION_KEY environment variable.\n" +
      "  Generate a key: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}

function normalizeKey(key: string): Buffer {
  return key.startsWith("0x") || key.length === 64 ? Buffer.from(key, "hex") : Buffer.from(key, "utf8");
}

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

export class CryptoController {
  private readonly algorithm: string;
  private readonly key: string;
  private readonly keyBuffer: Buffer; // normalized 32-byte buffer for cipher ops
  private readonly ivLength: number;
  private readonly saltRounds: number;
  private readonly hashAlgorithm: string;
  private readonly hmacAlgorithm: string;

  private static readonly DEFAULT_ALGORITHM = "aes-256-gcm";
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_ROUNDS = 10000;
  private static readonly DEFAULT_HASH_ALGORITHM = "sha256";
  private static readonly DEFAULT_HMAC_ALGORITHM = "sha256";

  constructor(config: CryptoConfig = {}) {
    this.algorithm = config.algorithm ?? CryptoController.DEFAULT_ALGORITHM;
    this.key = resolveKey(config.key);
    this.keyBuffer = normalizeKey(this.key);
    this.ivLength = config.ivLength ?? CryptoController.IV_LENGTH;
    this.saltRounds = config.saltRounds ?? CryptoController.SALT_ROUNDS;
    this.hashAlgorithm = config.hashAlgorithm ?? CryptoController.DEFAULT_HASH_ALGORITHM;
    this.hmacAlgorithm = config.hmacAlgorithm ?? CryptoController.DEFAULT_HMAC_ALGORITHM;
  }

  // ==================== STATIC METHODS ====================

  static encrypt(text: string, options: CryptoOptions = {}): string {
    return new CryptoController({ algorithm: options.algorithm, key: options.key }).encrypt(text);
  }

  static decrypt(data: string, options: CryptoOptions = {}): string {
    return new CryptoController({ algorithm: options.algorithm, key: options.key }).decrypt(data);
  }

  static async encryptForCache(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    options: CryptoOptions = {}
  ): Promise<EncryptedCacheEntry> {
    const algorithm = options.algorithm ?? CryptoController.DEFAULT_ALGORITHM;
    const key = resolveKey(options.key);
    const encoding = options.encoding ?? "hex";

    const keyBuffer = normalizeKey(key);
    const iv = crypto.randomBytes(CryptoController.IV_LENGTH);
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);

    let encrypted = cipher.update(JSON.stringify(data), "utf8", encoding);
    encrypted += cipher.final(encoding);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authTag: Buffer | null = (cipher as any).getAuthTag ? (cipher as any).getAuthTag() : null;

    return {
      encrypted: true,
      data: encrypted,
      iv: iv.toString("hex"),
      algorithm,
      ...(authTag && { authTag: authTag.toString("hex") }),
    };
  }

  static async decryptFromCache(
    entry: EncryptedCacheEntry,
    options: CryptoOptions = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const algorithm = options.algorithm ?? entry.algorithm;
    const key = resolveKey(options.key);
    const encoding = options.encoding ?? "hex";

    const keyBuffer = normalizeKey(key);
    const iv = Buffer.from(entry.iv, "hex");
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);

    if (entry.authTag) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (decipher as any).setAuthTag(Buffer.from(entry.authTag, "hex"));
    }

    let decrypted = decipher.update(entry.data, encoding, "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted) as unknown;
  }

  static shouldEncrypt(
    key: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    options: CacheEncryptionOptions = {}
  ): boolean {
    if (options.encrypt === false) return false;
    if (options.encrypt === true) return true;
    if (SENSITIVE_PATTERNS.some(p => p.test(key))) return true;
    if (options.encryptSensitive && typeof data === "object") {
      const dataString = JSON.stringify(data);
      if (SENSITIVE_PATTERNS.some(p => p.test(dataString))) return true;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tag = (cipher as any).getAuthTag() as Buffer;

    const result: EncryptedData = {
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
      encrypted: encrypted.toString("hex"),
      algorithm: this.algorithm,
      timestamp: Date.now(),
    };

    return JSON.stringify(result);
  }

  decrypt(encryptedData: string): string {
    const data = JSON.parse(encryptedData) as EncryptedData;

    const iv = Buffer.from(data.iv, "hex");
    const tag = Buffer.from(data.tag, "hex");
    const encrypted = Buffer.from(data.encrypted, "hex");

    const decipher = crypto.createDecipheriv(data.algorithm || this.algorithm, this.keyBuffer, iv);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (decipher as any).setAuthTag(tag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  }

  isEncrypted(data: string): boolean {
    try {
      const parsed = JSON.parse(data) as Record<string, unknown>;
      return (
        typeof parsed === "object" &&
        parsed !== null &&
        typeof parsed.iv === "string" &&
        typeof parsed.tag === "string" &&
        typeof parsed.encrypted === "string" &&
        typeof parsed.algorithm === "string" &&
        typeof parsed.timestamp === "number"
      );
    } catch {
      return false;
    }
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
    const expected = this.hmac(data, secret, algorithm);
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
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

  // ==================== TOKEN GENERATION ====================

  generateToken(payload: TokenPayload, expiresIn = 3600000): string {
    const tokenData = {
      ...payload,
      iat: Date.now(),
      exp: Date.now() + expiresIn,
      iss: "crypto-controller",
    };
    const data = JSON.stringify(tokenData);
    const signature = this.hmac(data);
    return Buffer.from(`${data}.${signature}`).toString("base64url");
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = Buffer.from(token, "base64url").toString("utf8");
      const dotIndex = decoded.lastIndexOf(".");
      if (dotIndex < 0) return null;

      const data = decoded.slice(0, dotIndex);
      const signature = decoded.slice(dotIndex + 1);

      if (!this.verifyHmac(data, signature)) return null;

      const payload = JSON.parse(data) as TokenPayload;
      if (payload.exp && Date.now() > payload.exp) return null;

      return payload;
    } catch {
      return null;
    }
  }

  // ==================== KEY DERIVATION ====================

  deriveKey(password: string, salt: string, iterations = this.saltRounds, keyLength = 32): Buffer {
    return crypto.pbkdf2Sync(password, salt, iterations, keyLength, this.hashAlgorithm);
  }

  generateKeyPair(
    type: "rsa" | "ec" | "ed25519" | "ed448" | "x25519" | "x448" | "dh" = "rsa",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any = {}
  ): crypto.KeyPairSyncResult<string, string> {
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
    return crypto.generateKeyPairSync(type as any, { ...defaultOptions, ...options });
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

  getInfo(): CryptoConfig {
    return {
      algorithm: this.algorithm,
      ivLength: this.ivLength,
      saltRounds: this.saltRounds,
      hashAlgorithm: this.hashAlgorithm,
      hmacAlgorithm: this.hmacAlgorithm,
    };
  }
}
