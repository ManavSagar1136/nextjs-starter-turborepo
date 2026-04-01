"use client";

import { useState, useEffect, useCallback } from "react";
import {
  recordUsage,
  getQuotaStatus,
  getAllQuotas,
  type RecordUsageResponse,
  type QuotaStatusResponse,
  type AllQuotasResponse,
  type QuotaStatus,
  type QuotaMap,
} from "../usage";

// ─── useRecordUsage ───────────────────────────────────────────────────────────

export interface UseRecordUsageReturn {
  record: (quotaSlug: string, quantity: number) => Promise<RecordUsageResponse>;
  isLoading: boolean;
  error: string | null;
  data: RecordUsageResponse | null;
  reset: () => void;
}

/**
 * Hook for recording quota usage.
 * The sessionId should come from your backend (obtained via exchangeToken).
 *
 * @example
 * const { record, isLoading } = useRecordUsage({ workspaceId, sessionId });
 * await record("emails", 10);
 */
export function useRecordUsage({
  workspaceId,
  sessionId,
  baseUrl,
}: {
  workspaceId: string;
  sessionId: string;
  baseUrl?: string;
}): UseRecordUsageReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecordUsageResponse | null>(null);

  const record = useCallback(
    async (quotaSlug: string, quantity: number): Promise<RecordUsageResponse> => {
      setIsLoading(true);
      setError(null);

      const result = await recordUsage({ workspaceId, quotaSlug, quantity, sessionId, baseUrl });

      setData(result);
      if (!result.success) setError(result.message ?? "Failed to record usage");
      setIsLoading(false);

      return result;
    },
    [workspaceId, sessionId, baseUrl],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { record, isLoading, error, data, reset };
}

// ─── useQuotaStatus ───────────────────────────────────────────────────────────

export interface UseQuotaStatusReturn {
  data: QuotaStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching the current status of a single quota.
 * Fetches on mount and whenever workspaceId, quotaSlug, or sessionId changes.
 *
 * @example
 * const { data, isLoading } = useQuotaStatus({ workspaceId, quotaSlug: "emails", sessionId });
 * if (data?.hasOverage) { ... }
 */
export function useQuotaStatus({
  workspaceId,
  quotaSlug,
  sessionId,
  baseUrl,
}: {
  workspaceId: string;
  quotaSlug: string;
  sessionId: string;
  baseUrl?: string;
}): UseQuotaStatusReturn {
  const [data, setData] = useState<QuotaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!workspaceId || !quotaSlug || !sessionId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getQuotaStatus({ workspaceId, quotaSlug, sessionId, baseUrl }).then((result: QuotaStatusResponse) => {
      if (cancelled) return;
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.message ?? "Failed to fetch quota status");
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, quotaSlug, sessionId, baseUrl, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, isLoading, error, refetch };
}

// ─── useAllQuotas ─────────────────────────────────────────────────────────────

export interface UseAllQuotasReturn {
  quotas: QuotaMap | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching all quota statuses for a workspace.
 * Fetches on mount and whenever workspaceId or sessionId changes.
 *
 * @example
 * const { quotas } = useAllQuotas({ workspaceId, sessionId });
 * const emailsOverage = quotas?.emails?.hasOverage;
 */
export function useAllQuotas({
  workspaceId,
  sessionId,
  baseUrl,
}: {
  workspaceId: string;
  sessionId: string;
  baseUrl?: string;
}): UseAllQuotasReturn {
  const [quotas, setQuotas] = useState<QuotaMap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!workspaceId || !sessionId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getAllQuotas({ workspaceId, sessionId, baseUrl }).then((result: AllQuotasResponse) => {
      if (cancelled) return;
      if (result.success && result.quotas) {
        setQuotas(result.quotas);
      } else {
        setError(result.message ?? "Failed to fetch quotas");
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, sessionId, baseUrl, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { quotas, isLoading, error, refetch };
}
