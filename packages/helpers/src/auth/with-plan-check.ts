/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";

/**
 * Options for withPlanCheck middleware.
 *
 * Must be composed INSIDE withPermissionCheck so that req.dbWorkspaceId
 * (the Prisma ObjectId) is already set:
 *
 * @example
 * const handlePOST = withPlanCheck(
 *   async (req) => { ... },
 *   { feature: "api-access" }
 * );
 * export const POST = withPermissionCheck(handlePOST, [WORKSPACE_ROLES.ADMIN]);
 *
 * @example
 * const handlePOST = withPlanCheck(
 *   async (req) => { ... },
 *   {
 *     limit: {
 *       slug: "max-assets",
 *       countFn: (id) => AssetsRepository.countByWorkspace(id),
 *     },
 *   }
 * );
 */
export interface PlanCheckOptions {
  /**
   * Feature slug that must be enabled on the workspace plan.
   * If the feature is absent or false, returns 403.
   */
  feature?: string;

  /**
   * Hard-cap limit check. Runs countFn and compares against workspace.limits[slug].
   * - null limit means unlimited — always passes.
   * - If current count >= limit, returns 402.
   */
  limit?: {
    slug: string;
    countFn: (dbWorkspaceId: string) => Promise<number>;
  };
}

/**
 * Middleware HOF that enforces feature flags and hard-cap limits from the
 * workspace's subscription plan snapshot (stored in workspace.features /
 * workspace.limits — populated by syncWorkspace on subscription events).
 *
 * Compose INSIDE withPermissionCheck — it reads req.dbWorkspaceId.
 */
export function withPlanCheck<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: PlanCheckOptions
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const dbWorkspaceId = (request as any).dbWorkspaceId as string | undefined;

    if (!dbWorkspaceId) {
      // dbWorkspaceId is set by withPermissionCheck — if missing, the handler
      // was called without it (internal API key bypass). Skip plan checks.
      return handler(request, ...args);
    }

    // Fetch only the plan snapshot fields — avoids loading relations
    const workspace = await prisma.workspace.findUnique({
      where: { id: dbWorkspaceId },
      select: { features: true, limits: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Not Found", message: "Workspace not found" }, { status: 404 });
    }

    const features = (workspace.features ?? {}) as Record<string, boolean>;
    const limits = (workspace.limits ?? {}) as Record<string, number | null>;

    // ── Feature check ────────────────────────────────────────────────────────
    if (options.feature) {
      // If features object has no data yet (subscription not synced), let through.
      // Once a subscription is assigned, syncWorkspace will populate it.
      const hasData = Object.keys(features).length > 0;
      if (hasData && features[options.feature] !== true) {
        return NextResponse.json(
          {
            error: "Feature Not Available",
            message: `Your current plan does not include this feature.`,
            feature: options.feature,
            upgradeRequired: true,
          },
          { status: 403 }
        );
      }
    }

    // ── Limit check ──────────────────────────────────────────────────────────
    if (options.limit) {
      const { slug, countFn } = options.limit;

      // If limits object has no data yet (subscription not synced), let through.
      const hasData = Object.keys(limits).length > 0;
      if (hasData && slug in limits) {
        const max = limits[slug];

        if (max !== null) {
          // null = unlimited
          const current = await countFn(dbWorkspaceId);

          if (current >= max) {
            return NextResponse.json(
              {
                error: "Plan Limit Reached",
                message: `You have reached the limit for this resource on your current plan.`,
                limit: slug,
                current,
                max,
                upgradeRequired: true,
              },
              { status: 402 }
            );
          }
        }
      }
    }

    return handler(request, ...args);
  };
}
