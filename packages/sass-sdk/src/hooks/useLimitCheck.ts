"use client";

import { useSubscriptionContext } from "@buildbase/saas-sdk";

/**
 * Hook to check a hard-cap limit from the workspace's subscription plan.
 *
 * Reads from the plan version synced via SubscriptionContextProvider.
 * A null limit means unlimited (always passes).
 *
 * @example
 * function AddAssetButton({ currentCount }: { currentCount: number }) {
 *   const { isAtLimit, limit } = useLimitCheck("max-assets");
 *   return (
 *     <Button
 *       disabled={isAtLimit(currentCount)}
 *       title={isAtLimit(currentCount) ? `Plan limit: ${limit} assets` : undefined}
 *     >
 *       Upload Asset
 *     </Button>
 *   );
 * }
 */
export function useLimitCheck(limitSlug: string) {
  const { response, loading } = useSubscriptionContext();

  // limits are stored as Record<string, number | null> on the plan version
  const rawLimit = response?.planVersion?.limits?.[limitSlug];

  // undefined means the plan has no data for this slug yet — treat as unlimited
  const limit: number | null = rawLimit !== undefined ? rawLimit : null;

  return {
    /** The plan limit, or null when unlimited / not yet loaded. */
    limit,
    /** True when the limit is null (unlimited) or plan data is not yet loaded. */
    isUnlimited: limit === null,
    /** True while subscription data is loading. */
    loading,
    /**
     * Returns true when currentCount has reached or exceeded the plan limit.
     * Always false when unlimited.
     */
    isAtLimit: (currentCount: number): boolean => limit !== null && currentCount >= limit,
    /**
     * Units remaining before the limit is hit.
     * Returns Infinity when unlimited.
     */
    remaining: (currentCount: number): number => (limit === null ? Infinity : Math.max(0, limit - currentCount)),
  };
}
