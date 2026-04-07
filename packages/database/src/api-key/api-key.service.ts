/**
 * API Key Service
 *
 * Manages API keys for the public REST API.
 * Keys are generated with a prefix (rk_live_) and stored as SHA-256 hashes.
 * The raw key is only returned once at creation time — it is never stored.
 */

import { randomBytes, createHash } from "crypto";
import { prisma } from "../index";

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

  const apiKey = await prisma.apiKey.create({
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
 * Verify an API key and return the associated workspace context if valid.
 */
export async function verifyApiKey(rawKey: string) {
  const keyHash = hashKey(rawKey);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { workspace: true },
  });

  if (!apiKey || !apiKey.isActive || apiKey.revokedAt) {
    return null;
  }

  // Update usage tracking (fire and forget — don't block the request)
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    })
    .catch(() => {});

  return {
    id: apiKey.id,
    name: apiKey.name,
    workspaceId: apiKey.workspaceId,
    workspace: apiKey.workspace,
    scopes: apiKey.scopes,
    rateLimitPerMinute: apiKey.rateLimitPerMinute,
  };
}

/**
 * List all active API keys for a workspace (hashes are never returned).
 */
export async function listApiKeys(workspaceId: string) {
  return prisma.apiKey.findMany({
    where: { workspaceId, isActive: true, revokedAt: null },
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
 * Returns null if the key does not exist or does not belong to the workspace.
 */
export async function revokeApiKey(id: string, workspaceId: string) {
  const key = await prisma.apiKey.findFirst({ where: { id, workspaceId } });
  if (!key) return null;

  return prisma.apiKey.update({
    where: { id },
    data: {
      isActive: false,
      revokedAt: new Date(),
    },
  });
}

/**
 * Permanently delete an API key.
 * Returns null if the key does not exist or does not belong to the workspace.
 */
export async function deleteApiKey(id: string, workspaceId: string) {
  const key = await prisma.apiKey.findFirst({ where: { id, workspaceId } });
  if (!key) return null;

  return prisma.apiKey.delete({ where: { id } });
}
