/**
 * Plan feature, limit, and quota slug constants.
 *
 * Source of truth lives in @buildbase/saas-sdk (client-safe).
 * This file re-exports from there so server-side code importing from
 * "@buildbase/helpers/auth" continues to work without breaking changes.
 */
export { PLAN_FEATURES, PLAN_LIMITS, PLAN_QUOTAS } from "@buildbase/saas-sdk";

export type { PlanFeatureSlug, PlanLimitSlug, PlanQuotaSlug } from "@buildbase/saas-sdk";
