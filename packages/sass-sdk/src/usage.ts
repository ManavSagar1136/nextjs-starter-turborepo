/**
 * Quota Usage
 * Server-side utilities for recording usage and checking quota status.
 * All functions require a sessionId obtained via exchangeToken().
 */
import { env } from "@buildbase/env";

// ─── Shared ───────────────────────────────────────────────────────────────────

function getBaseUrl(override?: string): string {
  return override ?? (env.NEXT_PUBLIC_SAAS_SERVER_URL as string) ?? "";
}

function usageHeaders(sessionId: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-session-id": sessionId,
  };
}

// ─── Record Usage ─────────────────────────────────────────────────────────────

export interface RecordUsageConfig {
  workspaceId: string;
  quotaSlug: string;
  quantity: number;
  sessionId: string;
  baseUrl?: string;
  /** Optional: identify where usage originated (e.g. 'backend', 'worker', 'cron') */
  source?: string;
  /** Optional: unique key to prevent duplicate recordings */
  idempotencyKey?: string;
  /** Optional: custom metadata to attach to the usage record */
  metadata?: Record<string, unknown>;
}

export interface RecordUsageResponse {
  success: boolean;
  /** Units consumed in this call */
  used?: number;
  /** Total consumed this period */
  consumed?: number;
  /** Units included in the plan */
  included?: number;
  /** Units still available (0 when overage starts) */
  available?: number;
  /** Units billed as overage */
  overage?: number;
  /** Whether billing is processed asynchronously */
  billedAsync?: boolean;
  message?: string;
}

/**
 * Record quota usage for a workspace.
 *
 * @example
 * const result = await recordUsage({
 *   workspaceId: "ws123",
 *   quotaSlug: "emails",
 *   quantity: 10,
 *   sessionId: "abc...",
 * });
 */
export const recordUsage = async (config: RecordUsageConfig): Promise<RecordUsageResponse> => {
  const { workspaceId, quotaSlug, quantity, sessionId, baseUrl, source, idempotencyKey, metadata } = config;

  if (!workspaceId || !quotaSlug || !sessionId) {
    return { success: false, message: "workspaceId, quotaSlug, and sessionId are required" };
  }

  const base = getBaseUrl(baseUrl);
  if (!base) {
    return { success: false, message: "No baseUrl configured (set NEXT_PUBLIC_SAAS_SERVER_URL)" };
  }

  try {
    const body: Record<string, unknown> = { quotaSlug, quantity };
    if (source !== undefined) body.source = source;
    if (idempotencyKey !== undefined) body.idempotencyKey = idempotencyKey;
    if (metadata !== undefined) body.metadata = metadata;

    const response = await fetch(`${base}/api/v1/public/workspaces/${workspaceId}/subscription/usage`, {
      method: "POST",
      headers: usageHeaders(sessionId),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return { success: false, message: `Record usage failed (${response.status}): ${errorText}` };
    }

    const data = await response.json();

    return {
      success: true,
      used: data.used,
      consumed: data.consumed,
      included: data.included,
      available: data.available,
      overage: data.overage,
      billedAsync: data.billedAsync,
    };
  } catch (error) {
    console.error("[recordUsage] Error:", error);
    return { success: false, message: "Failed to record usage" };
  }
};

// ─── Single Quota Status ──────────────────────────────────────────────────────

export interface QuotaStatusConfig {
  workspaceId: string;
  quotaSlug: string;
  sessionId: string;
  baseUrl?: string;
}

export interface QuotaStatus {
  quotaSlug: string;
  consumed: number;
  included: number;
  available: number;
  overage: number;
  hasOverage: boolean;
}

export interface QuotaStatusResponse {
  success: boolean;
  data?: QuotaStatus;
  message?: string;
}

/**
 * Get the current status of a single quota for a workspace.
 *
 * @example
 * const { data } = await getQuotaStatus({
 *   workspaceId: "ws123",
 *   quotaSlug: "emails",
 *   sessionId: "abc...",
 * });
 */
export const getQuotaStatus = async (config: QuotaStatusConfig): Promise<QuotaStatusResponse> => {
  const { workspaceId, quotaSlug, sessionId, baseUrl } = config;

  if (!workspaceId || !quotaSlug || !sessionId) {
    return { success: false, message: "workspaceId, quotaSlug, and sessionId are required" };
  }

  const base = getBaseUrl(baseUrl);
  if (!base) {
    return { success: false, message: "No baseUrl configured (set NEXT_PUBLIC_SAAS_SERVER_URL)" };
  }

  try {
    const url = new URL(`${base}/api/v1/public/workspaces/${workspaceId}/subscription/usage/status`);
    url.searchParams.set("quotaSlug", quotaSlug);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: usageHeaders(sessionId),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return { success: false, message: `Get quota status failed (${response.status}): ${errorText}` };
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        quotaSlug: data.quotaSlug,
        consumed: data.consumed,
        included: data.included,
        available: data.available,
        overage: data.overage,
        hasOverage: data.hasOverage,
      },
    };
  } catch (error) {
    console.error("[getQuotaStatus] Error:", error);
    return { success: false, message: "Failed to get quota status" };
  }
};

// ─── All Quotas Status ────────────────────────────────────────────────────────

export interface AllQuotasConfig {
  workspaceId: string;
  sessionId: string;
  baseUrl?: string;
}

export type QuotaMap = Record<string, QuotaStatus>;

export interface AllQuotasResponse {
  success: boolean;
  quotas?: QuotaMap;
  message?: string;
}

/**
 * Get the current status of all quotas for a workspace.
 *
 * @example
 * const { quotas } = await getAllQuotas({
 *   workspaceId: "ws123",
 *   sessionId: "abc...",
 * });
 * // quotas.emails.hasOverage === true
 */
export const getAllQuotas = async (config: AllQuotasConfig): Promise<AllQuotasResponse> => {
  const { workspaceId, sessionId, baseUrl } = config;

  if (!workspaceId || !sessionId) {
    return { success: false, message: "workspaceId and sessionId are required" };
  }

  const base = getBaseUrl(baseUrl);
  if (!base) {
    return { success: false, message: "No baseUrl configured (set NEXT_PUBLIC_SAAS_SERVER_URL)" };
  }

  try {
    const response = await fetch(`${base}/api/v1/public/workspaces/${workspaceId}/subscription/usage/all`, {
      method: "GET",
      headers: usageHeaders(sessionId),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return { success: false, message: `Get all quotas failed (${response.status}): ${errorText}` };
    }

    const data = await response.json();

    return {
      success: true,
      quotas: data.quotas as QuotaMap,
    };
  } catch (error) {
    console.error("[getAllQuotas] Error:", error);
    return { success: false, message: "Failed to get all quotas" };
  }
};

// ─── Usage Logs ───────────────────────────────────────────────────────────────

export interface UsageLogsConfig {
  workspaceId: string;
  sessionId: string;
  baseUrl?: string;
  /** Optional: filter logs by quota slug */
  quotaSlug?: string;
  /** Optional: ISO date string — filter logs from this date */
  from?: string;
  /** Optional: ISO date string — filter logs until this date */
  to?: string;
  /** Optional: filter logs by source */
  source?: string;
  /** Optional: page number (default: 1) */
  page?: number;
  /** Optional: results per page (default: 20) */
  limit?: number;
}

export interface UsageLogEntry {
  _id: string;
  quotaSlug: string;
  quantity: number;
  source?: string;
  createdAt: string;
}

export interface UsageLogsResponse {
  success: boolean;
  logs?: UsageLogEntry[];
  totalDocs?: number;
  totalPages?: number;
  page?: number;
  hasNextPage?: boolean;
  message?: string;
}

/**
 * Get paginated usage logs for a workspace.
 *
 * @example
 * const { logs } = await getUsageLogs({
 *   workspaceId: "ws123",
 *   sessionId: "abc...",
 *   quotaSlug: "emails",
 *   page: 1,
 *   limit: 20,
 * });
 */
export const getUsageLogs = async (config: UsageLogsConfig): Promise<UsageLogsResponse> => {
  const { workspaceId, sessionId, baseUrl, quotaSlug, from, to, source, page, limit } = config;

  if (!workspaceId || !sessionId) {
    return { success: false, message: "workspaceId and sessionId are required" };
  }

  const base = getBaseUrl(baseUrl);
  if (!base) {
    return { success: false, message: "No baseUrl configured (set NEXT_PUBLIC_SAAS_SERVER_URL)" };
  }

  try {
    const url = new URL(`${base}/api/v1/public/workspaces/${workspaceId}/subscription/usage/logs`);
    if (quotaSlug) url.searchParams.set("quotaSlug", quotaSlug);
    if (from) url.searchParams.set("from", from);
    if (to) url.searchParams.set("to", to);
    if (source) url.searchParams.set("source", source);
    if (page !== undefined) url.searchParams.set("page", String(page));
    if (limit !== undefined) url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: usageHeaders(sessionId),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return { success: false, message: `Get usage logs failed (${response.status}): ${errorText}` };
    }

    const data = await response.json();

    return {
      success: true,
      logs: data.logs,
      totalDocs: data.totalDocs,
      totalPages: data.totalPages,
      page: data.page,
      hasNextPage: data.hasNextPage,
    };
  } catch (error) {
    console.error("[getUsageLogs] Error:", error);
    return { success: false, message: "Failed to get usage logs" };
  }
};
