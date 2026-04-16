# @buildbase/crypto

Server-side cryptography for the CMS monorepo. Built on Node.js `crypto` — no third-party crypto dependencies.

Each `CryptoController` instance owns its own key and configuration. Create as many instances as you need, each with a different key, algorithm, or tuning.

---

## Installation

The package is already part of the monorepo workspace. Add it to any app or package:

```json
"dependencies": {
  "@buildbase/crypto": "*"
}
```

---

## Quick Start

```typescript
import { CryptoController, generateEncryptionKey } from "@buildbase/crypto";

// Generate a key (do this once, then store it in your env)
const key = generateEncryptionKey(); // 64-char hex string

// Create an instance bound to that key
const crypto = new CryptoController({ key });

const ciphertext = crypto.encrypt("hello world");
const plaintext = crypto.decrypt(ciphertext); // "hello world"
```

If `key` is omitted, the instance reads from the `SECRET_ENCRYPTION_KEY` environment variable.

---

## Use Cases

### 1. Database field encryption (Prisma)

Encrypt sensitive columns before saving and decrypt after reading.

```typescript
import { CryptoController } from "@buildbase/crypto";

const crypto = new CryptoController({ key: process.env.DB_ENCRYPTION_KEY });

// Before prisma.user.create()
const record = crypto.encryptFields(
  { name: "Alice", ssn: "123-45-6789", email: "alice@example.com" },
  ["ssn", "email"]
);
// { name: "Alice", ssn: "<ciphertext>", email: "<ciphertext>" }

// After prisma.user.findUnique()
const user = crypto.decryptFields(record, ["ssn", "email"]);
// { name: "Alice", ssn: "123-45-6789", email: "alice@example.com" }
```

Non-string field values (numbers, objects) are JSON-serialized before encryption and automatically deserialized on decrypt.

---

### 2. Full object encryption

Encrypt an entire object as a single opaque blob — useful for JWE-style payloads, audit logs, or encrypted cache entries.

```typescript
const crypto = new CryptoController({ key: process.env.PAYLOAD_KEY });

const token = crypto.encryptObject({
  userId: "u_123",
  permissions: ["read", "write"],
});
// Store token in DB or send to client

const payload = crypto.decryptObject<{ userId: string; permissions: string[] }>(
  token
);
payload.userId; // "u_123"
payload.permissions; // ["read", "write"]
```

---

### 3. Password hashing

PBKDF2-based hashing. Store `HashResult` in the database; never store the raw password.

```typescript
const crypto = new CryptoController({ key: process.env.AUTH_KEY });

// On signup
const hashed = crypto.hashPassword("myP@ssw0rd");
// Store hashed.hash and hashed.salt in DB

// On login
const valid = crypto.verifyPassword(inputPassword, hashed);
```

Adjust cost factor for your infrastructure:

```typescript
// Faster (CI / dev)
const fast = new CryptoController({ key, saltRounds: 1000 });

// Stronger (high-security auth)
const strong = new CryptoController({ key, saltRounds: 100_000 });
```

---

### 4. API key management

Generate API keys where only the hash is stored — the raw key is shown to the user once and never persisted.

```typescript
const crypto = new CryptoController({ key: process.env.API_KEY_SECRET });

// On creation
const { raw, hash, prefix } = crypto.generateApiKey("sk");
// raw    → "sk_4a7b..." — show once to user
// hash   → SHA-256 of raw — store in DB
// prefix → "sk_4a" — safe to display in UI

// On incoming request
const incoming = request.headers["x-api-key"];
const isValid = crypto.verifyApiKey(incoming, storedHash);
```

---

### 5. Webhook signature verification

Bind a signer to a shared secret without needing a full `CryptoController` instance.

```typescript
import { createHmacSigner } from "@buildbase/crypto";

const signer = createHmacSigner(process.env.WEBHOOK_SECRET!);

// On send (your side)
const signature = signer.sign(JSON.stringify(payload));
// Attach as header: X-Signature: <signature>

// On receive (third-party callback)
const isValid = signer.verify(rawBody, request.headers["x-signature"]);
if (!isValid)
  return Response.json({ error: "Invalid signature" }, { status: 401 });
```

Custom algorithm:

```typescript
const signer = createHmacSigner(secret, "sha512");
```

---

### 6. Session / auth tokens

Signed, expiring tokens — a lightweight alternative to JWT for internal use.

```typescript
const crypto = new CryptoController({ key: process.env.TOKEN_SECRET });

// Issue token (generic — T is the data shape)
const token = crypto.generateToken<{ userId: string; role: string }>(
  { userId: "u_123", role: "admin" },
  60 * 60 * 1000 // 1 hour in ms
);

// Verify — returns null if expired or tampered
const payload = crypto.verifyToken<{ userId: string; role: string }>(token);
if (!payload) return unauthorized();

console.log(payload.data.userId); // "u_123"
console.log(payload.exp); // expiry timestamp
```

---

### 7. Cache encryption

Encrypt arbitrary data for Redis or other cache stores. Automatically handles GCM auth tags.

```typescript
import { CryptoController } from "@buildbase/crypto";

const crypto = new CryptoController({ key: process.env.CACHE_KEY });

// Before storing
const entry = await CryptoController.encryptForCache(userData, {
  key: process.env.CACHE_KEY,
});
await redis.set("user:123", JSON.stringify(entry));

// After reading
const raw = await redis.get("user:123");
const entry = JSON.parse(raw);

if (CryptoController.isEncryptedCacheEntry(entry)) {
  const data = await CryptoController.decryptFromCache(entry, {
    key: process.env.CACHE_KEY,
  });
}
```

Auto-detect whether a cache key should be encrypted:

```typescript
import { shouldEncrypt } from "@buildbase/crypto";

shouldEncrypt("user_token", value); // true  — "token" pattern
shouldEncrypt("theme", value); // false
shouldEncrypt("prefs", value, { encrypt: true }); // true — explicit override
shouldEncrypt("payload", value, { encryptSensitive: true }); // true if value contains "password", "secret", etc.
```

---

### 8. Key rotation

Re-encrypt data under a new key without decrypting to a variable first.

```typescript
const oldCrypto = new CryptoController({ key: process.env.OLD_KEY });
const newCrypto = new CryptoController({ key: process.env.NEW_KEY });

// Single value
const rotated = oldCrypto.reEncrypt(storedCiphertext, newCrypto);

// Bulk rotation (Prisma example)
const records = await prisma.secret.findMany();

for (const record of records) {
  const rotated = oldCrypto.reEncrypt(record.value, newCrypto);
  await prisma.secret.update({
    where: { id: record.id },
    data: { value: rotated },
  });
}
```

---

### 9. HMAC signing

Sign arbitrary strings (request bodies, events, URLs) and verify them later.

```typescript
const crypto = new CryptoController({ key: process.env.SIGNING_KEY });

const signature = crypto.hmac(requestBody);
// Store or transmit signature alongside the payload

const valid = crypto.verifyHmac(requestBody, storedSignature);
```

---

### 10. Data masking (logging / display)

Prevent raw PII from appearing in logs or UI.

```typescript
const crypto = new CryptoController({ key });

crypto.makePreview("sk_test_1234567890abcdef", 6, 4); // "sk_tes******cdef"
crypto.maskEmail("alice@example.com"); // "al***@example.com"
crypto.maskPhone("+12025550189"); // "+1***89"
crypto.mask("supersecret"); // "***********"
```

---

### 11. Multiple isolated instances

Different subsystems can own their own key independently — no shared state, no cross-contamination.

```typescript
const userCrypto = new CryptoController({ key: process.env.USER_KEY });
const auditCrypto = new CryptoController({ key: process.env.AUDIT_KEY });
const paymentCrypto = new CryptoController({
  key: process.env.PAYMENT_KEY,
  saltRounds: 50_000,
});

// Each encrypts/decrypts only its own ciphertexts
const userToken = userCrypto.encrypt(userId);
const auditEntry = auditCrypto.encryptObject({ action, actor, ts: Date.now() });
const paymentToken = paymentCrypto.encryptObject({ cardLast4, billingZip });
```

---

## Configuration

```typescript
new CryptoController({
  key, // required — 64-char hex or 32-byte string, or omit for SECRET_ENCRYPTION_KEY env
  algorithm: "aes-256-gcm", // default — any CryptoAlgorithm value
  hashAlgorithm: "sha256", // default
  hmacAlgorithm: "sha256", // default
  ivLength: 16, // default (bytes)
  saltRounds: 10_000, // default PBKDF2 iterations
});
```

**Supported algorithms:** `aes-256-gcm` (default) · `aes-192-gcm` · `aes-128-gcm` · `aes-256-cbc` · `aes-192-cbc` · `aes-128-cbc`

---

## Generating a key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use the exported helper:

```typescript
import { generateEncryptionKey, isValidEncryptionKey } from "@buildbase/crypto";

const key = generateEncryptionKey(); // 64-char hex string
isValidEncryptionKey(key); // true
isValidEncryptionKey("too-short"); // false
```

---

## Error handling

```typescript
import {
  CryptoController,
  DecryptionError,
  InvalidKeyError,
  TokenError,
} from "@buildbase/crypto";

try {
  const plain = crypto.decrypt(ciphertext);
} catch (err) {
  if (err instanceof DecryptionError) {
    // Wrong key, corrupted data, or tampered ciphertext
  }
  if (err instanceof InvalidKeyError) {
    // Bad key format or wrong length for algorithm
  }
}

// verifyToken throws TokenError on malformed input; returns null for expired/invalid
try {
  const payload = crypto.verifyToken(token);
  if (!payload) {
    /* expired or tampered */
  }
} catch (err) {
  if (err instanceof TokenError) {
    /* structurally invalid token */
  }
}
```

---

## Static utilities (no key needed)

```typescript
import {
  generateEncryptionKey, // generate a new 64-char hex key
  isValidEncryptionKey, // validate a key string
  generateSecureString, // random hex string of N bytes
  hashString, // SHA-256 of a string
  shouldEncrypt, // heuristic: should this cache key/value be encrypted?
  isEncryptedCacheEntry, // type guard for EncryptedCacheEntry
  createHmacSigner, // factory: { sign, verify } bound to a secret
} from "@buildbase/crypto";
```

---

## Environment variable

| Variable                | Description                                                                  |
| ----------------------- | ---------------------------------------------------------------------------- |
| `SECRET_ENCRYPTION_KEY` | 64-char hex key — used as default when no `key` is passed to the constructor |
