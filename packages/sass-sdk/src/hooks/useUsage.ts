"use client";

/**
 * Server-side Proxy Usage Hooks
 *
 * These hooks call your app's own BACKEND routes — NOT the buildbase API directly.
 * The sessionId (org-level API token session) stays in an HttpOnly cookie and
 * NEVER reaches the browser.
 *
 * Use these when you need server-side quota recording (e.g. billing-critical events
 * that should not be triggered from the browser with the user's own session).
 *
 * For standard client-side quota tracking, use the built-in SDK hooks instead:
 *   useRecordUsage(workspaceId)       — from @buildbase/sdk
 *   useQuotaUsageStatus(workspaceId, quotaSlug)
 *   useAllQuotaUsage(workspaceId)
 *
 * Your app must register the route handlers from @buildbase/saas-sdk/route-handlers:
 *
 *   // app/api/saas/usage/record/route.ts
 *   import { createRecordUsageHandler } from "@buildbase/saas-sdk/route-handlers";
 *   export const POST = createRecordUsageHandler();
 *
 *   // app/api/saas/usage/status/route.ts
 *   import { createQuotaStatusHandler } from "@buildbase/saas-sdk/route-handlers";
 *   export const GET = createQuotaStatusHandler();
 *
 *   // app/api/saas/usage/all/route.ts
 *   import { createAllQuotasHandler } from "@buildbase/saas-sdk/route-handlers";
 *   export const GET = createAllQuotasHandler();
 */
import { useState, useEffect, useCallback } from "react";
import type { RecordUsageResponse, QuotaStatus, QuotaMap, UsageLogEntry } from "../usage";

const DEFAULT_BASE_PATH = "/api/saas/usage";

// ─── useServerRecordUsage ─────────────────────────────────────────────────────

export interface ServerRecordUsageParams {
  workspaceId: string;
  quotaSlug: string;
  quantity: number;
  /** Optional: identify where usage originated (e.g. 'web-app', 'worker') */
  source?: string;
  /** Optional: unique key to prevent duplicate recordings */
  idempotencyKey?: string;
}

export interface UseServerRecordUsageReturn {
  /**
   * Record quota usage via your app's secure backend route.
   * Provide workspaceId (from useSaaSWorkspaces) and the quota details.
   * The sessionId is never sent from the browser — it lives in an HttpOnly cookie.
   */
  record: (params: ServerRecordUsageParams) => Promise<RecordUsageResponse>;
  isLoading: boolean;
  error: string | null;
  data: RecordUsageResponse | null;
  reset: () => void;
}

/**
 * Server-side proxy hook for recording quota usage.
 * Calls your app's `/api/saas/usage/record` route (POST).
 *
 * @example
 * const { workspaces } = useSaaSWorkspaces();
 * const { record, isLoading } = useServerRecordUsage();
 * await record(workspaces[0].id, "emails", 10);
 */
export function useServerRecordUsage(options?: { basePath?: string }): UseServerRecordUsageReturn {
  const basePath = options?.basePath ?? DEFAULT_BASE_PATH;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecordUsageResponse | null>(null);

  const record = useCallback(
    async (params: ServerRecordUsageParams): Promise<RecordUsageResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${basePath}/record`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        const result: RecordUsageResponse = await response.json();
        setData(result);
        if (!result.success) setError(result.message ?? "Failed to record usage");
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to record usage";
        setError(message);
        const result: RecordUsageResponse = { success: false, message };
        setData(result);
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [basePath]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { record, isLoading, error, data, reset };
}

// ─── useServerQuotaStatus ─────────────────────────────────────────────────────

export interface UseServerQuotaStatusReturn {
  data: QuotaStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Server-side proxy hook for fetching a single quota status.
 * Calls your app's `/api/saas/usage/status` route (GET).
 *
 * @example
 * const { workspaces } = useSaaSWorkspaces();
 * const { data } = useServerQuotaStatus({ workspaceId: workspaces[0].id, quotaSlug: "emails" });
 * if (data?.hasOverage) { ... }
 */
export function useServerQuotaStatus(options: {
  workspaceId: string;
  quotaSlug: string;
  basePath?: string;
}): UseServerQuotaStatusReturn {
  const { workspaceId, quotaSlug, basePath = DEFAULT_BASE_PATH } = options;
  const [data, setData] = useState<QuotaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!workspaceId || !quotaSlug) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({ workspaceId, quotaSlug });
    fetch(`${basePath}/status?${params}`)
      .then(res => res.json())
      .then((result: { success: boolean; data?: QuotaStatus; message?: string }) => {
        if (cancelled) return;
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.message ?? "Failed to fetch quota status");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to fetch quota status");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, quotaSlug, basePath, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { data, isLoading, error, refetch };
}

// ─── useServerAllQuotas ───────────────────────────────────────────────────────

export interface UseServerAllQuotasReturn {
  quotas: QuotaMap | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Server-side proxy hook for fetching all quota statuses.
 * Calls your app's `/api/saas/usage/all` route (GET).
 *
 * @example
 * const { workspaces } = useSaaSWorkspaces();
 * const { quotas } = useServerAllQuotas({ workspaceId: workspaces[0].id });
 * const emailsOverage = quotas?.emails?.hasOverage;
 */
export function useServerAllQuotas(options: { workspaceId: string; basePath?: string }): UseServerAllQuotasReturn {
  const { workspaceId, basePath = DEFAULT_BASE_PATH } = options;
  const [quotas, setQuotas] = useState<QuotaMap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!workspaceId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({ workspaceId });
    fetch(`${basePath}/all?${params}`)
      .then(res => res.json())
      .then((result: { success: boolean; quotas?: QuotaMap; message?: string }) => {
        if (cancelled) return;
        if (result.success && result.quotas) {
          setQuotas(result.quotas);
        } else {
          setError(result.message ?? "Failed to fetch quotas");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to fetch quotas");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, basePath, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { quotas, isLoading, error, refetch };
}

// ─── useServerUsageLogs ───────────────────────────────────────────────────────

export interface UseServerUsageLogsOptions {
  workspaceId: string;
  quotaSlug?: string;
  from?: string;
  to?: string;
  source?: string;
  page?: number;
  limit?: number;
  basePath?: string;
}

export interface UseServerUsageLogsReturn {
  logs: UsageLogEntry[];
  totalDocs: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Server-side proxy hook for fetching paginated usage logs.
 * Calls your app's `/api/saas/usage/logs` route (GET).
 *
 * @example
 * const { workspaces } = useSaaSWorkspaces();
 * const { logs, totalPages } = useServerUsageLogs({ workspaceId: workspaces[0].id, quotaSlug: "emails" });
 */
export function useServerUsageLogs(options: UseServerUsageLogsOptions): UseServerUsageLogsReturn {
  const { workspaceId, quotaSlug, from, to, source, page = 1, limit = 20, basePath = DEFAULT_BASE_PATH } = options;
  const [logs, setLogs] = useState<UsageLogEntry[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!workspaceId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({ workspaceId });
    if (quotaSlug) params.set("quotaSlug", quotaSlug);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (source) params.set("source", source);
    params.set("page", String(page));
    params.set("limit", String(limit));

    fetch(`${basePath}/logs?${params}`)
      .then(res => res.json())
      .then(
        (result: {
          success: boolean;
          logs?: UsageLogEntry[];
          totalDocs?: number;
          totalPages?: number;
          page?: number;
          hasNextPage?: boolean;
          message?: string;
        }) => {
          if (cancelled) return;
          if (result.success) {
            setLogs(result.logs ?? []);
            setTotalDocs(result.totalDocs ?? 0);
            setTotalPages(result.totalPages ?? 0);
            setCurrentPage(result.page ?? page);
            setHasNextPage(result.hasNextPage ?? false);
          } else {
            setError(result.message ?? "Failed to fetch usage logs");
          }
        }
      )
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to fetch usage logs");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, quotaSlug, from, to, source, page, limit, basePath, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { logs, totalDocs, totalPages, page: currentPage, hasNextPage, isLoading, error, refetch };
}
