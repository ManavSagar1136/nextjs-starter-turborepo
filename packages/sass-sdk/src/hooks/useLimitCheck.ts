"use client";

import { useState, useEffect } from "react";
import { useSubscriptionContext } from "@buildbase/saas-sdk";

interface UseLimitCheckOptions {
  /**
   * Optional async function that fetches the current count from your DB.
   * When provided, `currentCount` and `isAtLimit` (no-arg form) are available.
   */
  fetchCount?: () => Promise<number>;
}

/**
 * Hook to check a hard-cap limit from the workspace's subscription plan.
 *
 * Reads the max limit from Buildbase (via SubscriptionContextProvider).
 * When `fetchCount` is provided, also fetches the current count from the DB
 * so callers don't need to manage it manually.
 *
 * @example — with auto-fetched count
 * const { limit, currentCount, isAtLimit, loading } = useLimitCheck(
 *   PLAN_LIMITS.MAX_API_KEYS,
 *   { fetchCount: () => API.apiKeys.count() }
 * );
 * <Button disabled={isAtLimit()}>New Key</Button>
 *
 * @example — caller-supplied count (existing pattern, still works)
 * const { isAtLimit, limit } = useLimitCheck("max-assets");
 * <Button disabled={isAtLimit(currentCount)}>Upload</Button>
 */
export function useLimitCheck(limitSlug: string, options?: UseLimitCheckOptions) {
  const { response, loading: planLoading } = useSubscriptionContext();
  const [currentCount, setCurrentCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  useEffect(() => {
    if (!options?.fetchCount) return;
    let cancelled = false;
    setCountLoading(true);
    options
      .fetchCount()
      .then(count => {
        if (!cancelled) setCurrentCount(count);
      })
      .catch(() => {
        if (!cancelled) setCurrentCount(null);
      })
      .finally(() => {
        if (!cancelled) setCountLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.fetchCount]);

  // When plan checks are disabled, treat all limits as unlimited
  if (process.env.NEXT_PUBLIC_DISABLE_PLAN_CHECKS === "true") {
    return {
      limit: null,
      currentCount: currentCount ?? 0,
      isUnlimited: true,
      loading: false,
      isAtLimit: (_currentCount?: number): boolean => false,
      remaining: (_currentCount?: number): number => Infinity,
      refetchCount: options?.fetchCount
        ? async () => {
            const count = await options.fetchCount!();
            setCurrentCount(count);
          }
        : undefined,
    };
  }

  const rawLimit = response?.planVersion?.limits?.[limitSlug];

  // undefined means the plan has no data for this slug yet — treat as unlimited
  const limit: number | null = rawLimit !== undefined ? rawLimit : null;

  const resolveCount = (arg?: number): number => arg ?? currentCount ?? 0;

  return {
    /** The plan max limit from Buildbase, or null when unlimited / not yet loaded. */
    limit,
    /**
     * The current count fetched from DB (only populated when `fetchCount` is provided).
     * null while loading.
     */
    currentCount,
    /** True when the limit is null (unlimited). */
    isUnlimited: limit === null,
    /** True while either subscription data or the DB count is loading. */
    loading: planLoading || countLoading,
    /**
     * Returns true when the count has reached or exceeded the plan limit.
     * - No argument: uses the count fetched by `fetchCount` (requires option to be set).
     * - With argument: uses the provided count (caller-supplied pattern).
     */
    isAtLimit: (arg?: number): boolean => limit !== null && resolveCount(arg) >= limit,
    /**
     * Units remaining before the limit is hit.
     * Returns Infinity when unlimited.
     */
    remaining: (arg?: number): number => (limit === null ? Infinity : Math.max(0, limit - resolveCount(arg))),
    /**
     * Manually re-fetch the current count from DB (e.g. after a mutation).
     * Only available when `fetchCount` is provided.
     */
    refetchCount: options?.fetchCount
      ? async () => {
          const count = await options.fetchCount!();
          setCurrentCount(count);
        }
      : undefined,
  };
}
