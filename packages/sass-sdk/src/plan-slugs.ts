/**
 * Plan feature, limit, and quota slug constants.
 *
 * These must match the slugs configured in the Buildbase dashboard exactly.
 * Use these constants everywhere — client and server — instead of raw string
 * literals so that a slug rename only requires changing one file.
 *
 * Server-side (@buildbase/helpers/auth) re-exports these so both layers share the
 * same source of truth without duplication.
 */

/**
 * Feature flags — boolean gates that enable/disable entire capabilities.
 * Checked by `withPlanCheck` (server) and `useFeatureGate` (client).
 */
export const PLAN_FEATURES = {
  /** Enables API key creation and programmatic access to the workspace API. */
  API_ACCESS: "api-access",
} as const;

export type PlanFeatureSlug = (typeof PLAN_FEATURES)[keyof typeof PLAN_FEATURES];

/**
 * Hard-cap limits — integer ceilings on resource counts.
 * Enforced by `withPlanCheck` (server) and `useLimitCheck` (client).
 * A `null` limit means unlimited.
 */
export const PLAN_LIMITS = {
  /** Maximum number of active API keys per workspace. */
  MAX_API_KEYS: "max-api-keys",
  /** Maximum number of stored assets (files) per workspace. */
  MAX_ASSETS: "max-assets",
} as const;

export type PlanLimitSlug = (typeof PLAN_LIMITS)[keyof typeof PLAN_LIMITS];

/**
 * Metered quotas — usage counters that reset each billing period.
 * Enforced by `withQuotaCheck` (server) and `useQuotaUsageStatus` (client).
 */
export const PLAN_QUOTAS = {
  /** Total bytes of file storage consumed this billing period. */
  STORAGE: "storage",
} as const;

export type PlanQuotaSlug = (typeof PLAN_QUOTAS)[keyof typeof PLAN_QUOTAS];
