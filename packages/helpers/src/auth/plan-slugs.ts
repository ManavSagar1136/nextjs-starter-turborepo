/**
 * Plan feature, limit, and quota slugs.
 *
 * These must match the slugs configured in the Buildbase dashboard exactly.
 * Use these constants everywhere instead of raw string literals so that
 * a slug rename only requires changing one place.
 */

/**
 * Feature flags — boolean gates that enable/disable entire capabilities.
 * Stored in workspace.features and checked by withPlanCheck / useFeatureGate.
 */
export const PLAN_FEATURES = {
  /** Enables API key creation and programmatic access to the workspace API. */
  API_ACCESS: "api-access",
} as const;

export type PlanFeatureSlug = (typeof PLAN_FEATURES)[keyof typeof PLAN_FEATURES];

/**
 * Hard-cap limits — integer ceilings on resource counts.
 * Stored in workspace.limits and enforced by withPlanCheck / useLimitCheck.
 * null = unlimited.
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
 * Tracked via Buildbase SDK and enforced by withQuotaCheck / useQuotaUsageStatus.
 */
export const PLAN_QUOTAS = {
  /** Total bytes of file storage consumed this billing period. */
  STORAGE: "storage",
} as const;

export type PlanQuotaSlug = (typeof PLAN_QUOTAS)[keyof typeof PLAN_QUOTAS];
