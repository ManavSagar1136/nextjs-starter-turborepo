"use client";

import React from "react";
import { useFeatureGate, FEATURE_STATES } from "@buildbase/saas-sdk";
import type { UseFeatureGateOptions } from "@buildbase/saas-sdk";

export interface FeatureGateProps extends UseFeatureGateOptions {
  /** The feature slug to check against the subscription plan. */
  featureSlug: string;
  /** Rendered when access is allowed (state === OK). */
  children: React.ReactNode;
  /**
   * Rendered when the feature is fully denied (not-included / not-permitted).
   * When quota is EXHAUSTED, children are rendered in read-only mode instead.
   * Defaults to null.
   */
  fallback?: React.ReactNode;
  /** Rendered while subscription data is loading. Defaults to null. */
  loadingFallback?: React.ReactNode;
  /**
   * Extra boolean condition evaluated alongside the feature check.
   * When false, the fallback is rendered regardless of feature state.
   * Useful for combining role checks with plan checks.
   * Defaults to true.
   *
   * @example
   * <FeatureGate featureSlug="api-access" additionalCondition={isEditor}>
   *   <ApiKeyManager />
   * </FeatureGate>
   */
  additionalCondition?: boolean;
}

/**
 * Conditionally renders children based on feature gate state.
 *
 * Behaviour:
 * - OK → renders children normally
 * - EXHAUSTED → renders children with `readOnly={true}` (quota used up but feature included)
 * - NOT_INCLUDED / NOT_PERMITTED → renders fallback
 * - LOADING → renders loadingFallback
 * - additionalCondition=false → renders fallback regardless
 *
 * @example
 * <FeatureGate featureSlug="api-access" fallback={<UpgradeBanner />}>
 *   <ApiKeyManager />
 * </FeatureGate>
 *
 * @example
 * // Read-only when quota exhausted, hidden when not in plan
 * <FeatureGate featureSlug="storage" quotaSlug="storage" fallback={<UpgradeBanner />}>
 *   <AssetGrid />
 * </FeatureGate>
 */
export function FeatureGate({
  featureSlug,
  children,
  fallback = null,
  loadingFallback = null,
  additionalCondition = true,
  ...gateOptions
}: FeatureGateProps): React.ReactElement | null {
  const { state } = useFeatureGate(featureSlug, gateOptions);

  if (state === FEATURE_STATES.LOADING) return <>{loadingFallback}</>;

  if (!additionalCondition) return <>{fallback}</>;

  if (state === FEATURE_STATES.OK) return <>{children}</>;

  // Quota exhausted but feature is included → render children as read-only
  if (state === FEATURE_STATES.EXHAUSTED) {
    return <>{cloneWithReadOnly(children)}</>;
  }

  // NOT_INCLUDED, NOT_PERMITTED, ERROR → show fallback
  return <>{fallback}</>;
}

/**
 * Passes `readOnly={true}` to a single React element child.
 * If children is a fragment or array, returns as-is (components should
 * consume readOnly via useFeatureGate directly in that case).
 */
function cloneWithReadOnly(children: React.ReactNode): React.ReactNode {
  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ readOnly?: boolean }>, {
      readOnly: true,
    });
  }
  return children;
}
