"use client";

import { useSubscriptionContext, useQuotaUsageStatus, useSaaSWorkspaces } from "@buildbase/sdk";

/**
 * Possible states for a feature gate.
 *
 * - OK: Feature is included in the plan and available to use.
 * - LOADING: Subscription or quota data is still loading.
 * - ERROR: Failed to load subscription or quota data.
 * - NOT_INCLUDED: Feature is not part of the current subscription plan.
 * - EXHAUSTED: Feature is included but the quota has been fully consumed.
 * - NOT_PERMITTED: User does not have the required role/permission.
 */
export const FEATURE_STATES = {
  OK: "ok",
  LOADING: "loading",
  ERROR: "error",
  NOT_INCLUDED: "not-included",
  EXHAUSTED: "exhausted",
  NOT_PERMITTED: "not-permitted",
} as const;

export type FeatureState = (typeof FEATURE_STATES)[keyof typeof FEATURE_STATES];

export interface UseFeatureGateOptions {
  /**
   * Optional quota slug to check alongside the feature flag.
   * When provided, the gate transitions to EXHAUSTED when quota.available <= 0.
   */
  quotaSlug?: string;

  /**
   * Set to false to treat the user as not-permitted regardless of plan.
   * Useful for combining role checks with plan checks.
   * Defaults to true.
   */
  hasPermission?: boolean;
}

export interface UseFeatureGateReturn {
  /** Resolved feature state. */
  state: FeatureState;
  /** True when state === FEATURE_STATES.OK. */
  isAllowed: boolean;
  /** True while subscription or quota data is loading. */
  loading: boolean;
  /** True when the feature is not part of the current plan. */
  isNotIncluded: boolean;
  /** True when the quota has been fully consumed. */
  isExhausted: boolean;
  /** True when the user lacks the required permission. */
  isNotPermitted: boolean;
}

/**
 * Hook that resolves the access state for a given feature slug.
 *
 * Reads from SubscriptionContextProvider (plan features + limits) and
 * optionally checks quota availability via useQuotaUsageStatus.
 *
 * @example
 * function AddApiKeyButton() {
 *   const { isAllowed, state } = useFeatureGate("api-access");
 *   // ...
 * }
 *
 * @example
 * // With quota check and role guard
 * function UploadButton() {
 *   const isEditor = userRole === "editor";
 *   const { state } = useFeatureGate("storage", {
 *     quotaSlug: "storage",
 *     hasPermission: isEditor,
 *   });
 * }
 */
export function useFeatureGate(featureSlug: string, options: UseFeatureGateOptions = {}): UseFeatureGateReturn {
  const { hasPermission = true, quotaSlug } = options;

  const { response, loading: subLoading } = useSubscriptionContext();
  const { currentWorkspace } = useSaaSWorkspaces();

  // Quota check is only active when a quotaSlug is provided
  // Pass null when no quotaSlug to skip fetching
  const quotaResult = useQuotaUsageStatus(quotaSlug ? (currentWorkspace?._id ?? null) : null, quotaSlug ?? null);

  const quotaLoading = quotaSlug ? quotaResult.loading : false;
  const loading = subLoading || quotaLoading;

  // Permission check takes precedence — evaluated before plan data loads
  if (!hasPermission) {
    return buildReturn(FEATURE_STATES.NOT_PERMITTED, loading);
  }

  if (loading) {
    return buildReturn(FEATURE_STATES.LOADING, true);
  }

  // Feature included check — null/undefined means plan data not loaded yet (fail-open)
  const featureEnabled = response?.planVersion?.features?.[featureSlug];

  // If plan data is loaded and feature is explicitly false → not included
  if (response?.planVersion && featureEnabled === false) {
    return buildReturn(FEATURE_STATES.NOT_INCLUDED, false);
  }

  // Quota exhausted check — uses `status` (not `data`) per SDK return shape
  if (quotaSlug && quotaResult.status) {
    const { available } = quotaResult.status;
    if (available <= 0) {
      return buildReturn(FEATURE_STATES.EXHAUSTED, false);
    }
  }

  if (quotaResult.error && quotaSlug) {
    return buildReturn(FEATURE_STATES.ERROR, false);
  }

  return buildReturn(FEATURE_STATES.OK, false);
}

function buildReturn(state: FeatureState, loading: boolean): UseFeatureGateReturn {
  return {
    state,
    loading,
    isAllowed: state === FEATURE_STATES.OK,
    isNotIncluded: state === FEATURE_STATES.NOT_INCLUDED,
    isExhausted: state === FEATURE_STATES.EXHAUSTED,
    isNotPermitted: state === FEATURE_STATES.NOT_PERMITTED,
  };
}
