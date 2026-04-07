/**
 * API Key Service
 *
 * Manages API keys for the public REST API.
 * Keys are generated with a prefix (rk_live_) and stored as SHA-256 hashes.
 * The raw key is only returned once at creation time — it is never stored.
 */

import { randomBytes, createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../index";

export class ApiKeyNameConflictError extends Error {
  constructor() {
    super("An API key with this name already exists in the workspace");
    this.name = "ApiKeyNameConflictError";
  }
}

// ─── Key generation ───────────────────────────────────────────────────────────

const KEY_PREFIX = "rk_live_";
const KEY_LENGTH = 32; // 32 random bytes = 64 hex chars

function generateRawKey(): string {
  return KEY_PREFIX + randomBytes(KEY_LENGTH).toString("hex");
}

function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

function getPrefix(rawKey: string): string {
  return rawKey.substring(0, 12); // e.g. "rk_live_a1b2"
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateApiKeyInput {
  name: string;
  workspaceId: string;
  createdById?: string;
  scopes?: string[];
  rateLimitPerMinute?: number;
}

export interface CreateApiKeyResult {
  id: string;
  name: string;
  prefix: string;
  rawKey: string; // Only returned at creation time!
  scopes: string[];
  createdAt: Date;
}

// ─── CRUD operations ──────────────────────────────────────────────────────────

/**
 * Create a new API key. The raw key is only returned once at creation time.
 */
export async function createApiKey(input: CreateApiKeyInput): Promise<CreateApiKeyResult> {
  const rawKey = generateRawKey();
  const keyHash = hashKey(rawKey);
  const prefix = getPrefix(rawKey);

  // Application-level check before the DB unique constraint fires,
  // so we can throw a typed error with a clear message instead of P2002.
  const existing = await prisma.apiKey.findFirst({
    where: { workspaceId: input.workspaceId, name: input.name },
    select: { id: true },
  });
  if (existing) throw new ApiKeyNameConflictError();

  let apiKey;
  try {
    apiKey = await prisma.apiKey.create({
      data: {
        name: input.name,
        prefix,
        keyHash,
        workspaceId: input.workspaceId,
        createdById: input.createdById,
        scopes: input.scopes ?? [],
        rateLimitPerMinute: input.rateLimitPerMinute ?? 60,
      },
    });
  } catch (err) {
    // Safety net for race conditions that slip past the findFirst check above
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ApiKeyNameConflictError();
    }
    throw err;
  }

  return {
    id: apiKey.id,
    name: apiKey.name,
    prefix: apiKey.prefix,
    rawKey, // Only time the full key is available
    scopes: apiKey.scopes,
    createdAt: apiKey.createdAt,
  };
}

/**
 * Verify an API key and return the associated context if valid.
 */
export async function verifyApiKey(rawKey: string) {
  const keyHash = hashKey(rawKey);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      scopes: true,
      rateLimitPerMinute: true,
      isActive: true,
      revokedAt: true,
    },
  });

  if (!apiKey || !apiKey.isActive || apiKey.revokedAt) {
    return null;
  }

  // Update usage tracking (fire and forget — don't block the request)
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date(), usageCount: { increment: 1 } },
    })
    .catch(() => {});

  return {
    id: apiKey.id,
    name: apiKey.name,
    workspaceId: apiKey.workspaceId,
    scopes: apiKey.scopes,
    rateLimitPerMinute: apiKey.rateLimitPerMinute,
  };
}

/**
 * List all active API keys for a workspace (hashes are never returned).
 */
export async function listApiKeys(workspaceId: string) {
  return prisma.apiKey.findMany({
    where: { workspaceId, isActive: true },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      rateLimitPerMinute: true,
      lastUsedAt: true,
      usageCount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Revoke an API key (soft delete — marks as inactive).
 * Returns the count of updated records (0 = not found / wrong workspace).
 * Single atomic operation — no TOCTOU race.
 */
export async function revokeApiKey(id: string, workspaceId: string): Promise<{ count: number }> {
  return prisma.apiKey.updateMany({
    where: { id, workspaceId, isActive: true },
    data: { isActive: false, revokedAt: new Date() },
  });
}

/**
 * Permanently delete an API key.
 * Returns the count of deleted records (0 = not found / wrong workspace).
 * Single atomic operation — no TOCTOU race.
 */
export async function deleteApiKey(id: string, workspaceId: string): Promise<{ count: number }> {
  return prisma.apiKey.deleteMany({
    where: { id, workspaceId },
  });
}
