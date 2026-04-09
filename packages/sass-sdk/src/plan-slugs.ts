/**
 * Plan feature, limit, and quota slug constants.
 *
 * These must match the slugs configured in the Buildbase dashboard exactly.
 * Use these constants everywhere — client and server — instead of raw string
 * literals so that a slug rename only requires changing one file.
 *
 * Server-side (@buildbase/helpers/auth) re-exports these so both layers share the
 * same source of truth without duplication.
 *
 * See PLAN_DESIGN.md for the full product design spec and developer checklist.
 */

/**
 * Feature flags — boolean gates that enable/disable entire modules.
 * Checked by `withPlanCheck` (server) and `useFeatureGate` (client).
 */
export const PLAN_FEATURES = {
  /** Enables API key creation and programmatic access to the workspace API. */
  API_ACCESS: "api-access",
  /** Enables the media library (file upload, asset management). */
  MEDIA_LIBRARY: "media-library",
} as const;

export type PlanFeatureSlug = (typeof PLAN_FEATURES)[keyof typeof PLAN_FEATURES];

/**
 * Hard-cap limits — integer ceilings on countable resources.
 * Enforced by `withPlanCheck` (server) and `useLimitCheck` (client).
 * A `null` limit means unlimited on that plan tier.
 */
export const PLAN_LIMITS = {
  /** Maximum number of active API keys per workspace. */
  MAX_API_KEYS: "max-api-keys",
} as const;

export type PlanLimitSlug = (typeof PLAN_LIMITS)[keyof typeof PLAN_LIMITS];

/**
 * Metered quotas — usage counters that reset each billing period.
 * Enforced by `withQuotaCheck` (server) and `useServerQuotaStatus` (client).
 * Quota amounts and overage policy are configured in the Buildbase dashboard.
 */
export const PLAN_QUOTAS = {
  /** API calls made against the workspace API this billing period. */
  API_CALLS: "api-calls",
  /** Storage consumed (in MB) this billing period. */
  MEDIA_STORAGE: "media-storage",
} as const;

export type PlanQuotaSlug = (typeof PLAN_QUOTAS)[keyof typeof PLAN_QUOTAS];

// ─────────────────────────────────────────────────────────────────────────────
// NO FREE PLAN — SUBSCRIPTION REQUIRED
// ─────────────────────────────────────────────────────────────────────────────
//
// There is no free tier. New workspaces start with null features/limits (no plan
// data) and are blocked by withPlanCheck until a subscription or trial is active.
//
// Trial flow:
//   workspace:created  → features/limits written as null (no plan data)
//   Buildbase trial    → workspace:updated fires with full plan version data
//   withPlanCheck      → reads workspace.features from local DB; null = blocked
//
// ⚠️  MAINTENANCE RULE (enforced in CLAUDE.md):
//     When adding a new PLAN_FEATURES entry: configure in Buildbase dashboard on all paid plans
//     When adding a new PLAN_LIMITS entry:   configure in Buildbase dashboard on all paid plans
//     When adding a new PLAN_QUOTAS entry:   configure quota + overage in Buildbase dashboard
//     There are NO defaults to update in code — all plan values come from Buildbase.
//
// ─────────────────────────────────────────────────────────────────────────────
