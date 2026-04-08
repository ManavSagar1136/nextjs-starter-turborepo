"use client";

import React from "react";
import { useFeatureGate, FEATURE_STATES } from "@buildbase/saas-sdk";
import type { UseFeatureGateOptions } from "@buildbase/saas-sdk";

export interface FeatureGateProps extends UseFeatureGateOptions {
  /** The feature slug to check against the subscription plan. */
  featureSlug: string;
  /** Rendered when access is allowed. */
  children: React.ReactNode;
  /**
   * Rendered when the feature is denied (not-included / exhausted / not-permitted).
   * Defaults to null.
   */
  fallback?: React.ReactNode;
  /** Rendered while subscription data is loading. Defaults to null. */
  loadingFallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on feature gate state.
 *
 * @example
 * <FeatureGate featureSlug="api-access" fallback={<UpgradeBanner />}>
 *   <ApiKeyManager />
 * </FeatureGate>
 */
export function FeatureGate({
  featureSlug,
  children,
  fallback = null,
  loadingFallback = null,
  ...gateOptions
}: FeatureGateProps): React.ReactElement | null {
  const { state } = useFeatureGate(featureSlug, gateOptions);

  if (state === FEATURE_STATES.LOADING) return <>{loadingFallback}</>;
  if (state === FEATURE_STATES.OK) return <>{children}</>;
  return <>{fallback}</>;
}
