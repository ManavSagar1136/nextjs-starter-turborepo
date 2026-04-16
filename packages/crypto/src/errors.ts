export class CryptoError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "CryptoError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class InvalidKeyError extends CryptoError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidKeyError";
  }
}

export class DecryptionError extends CryptoError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "DecryptionError";
  }
}

export class TokenError extends CryptoError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "TokenError";
  }
}
