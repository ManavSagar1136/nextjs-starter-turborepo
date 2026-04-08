/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getOrRefreshSessionFromRequest, buildSetCookieHeader } from "@buildbase/saas-sdk";
import { getQuotaStatus, recordUsage } from "@buildbase/saas-sdk";

/**
 * Options for withQuotaCheck middleware.
 *
 * @example
 * // Check + record storage quota on asset upload
 * const handlePOST = withPlanCheck(
 *   withQuotaCheck(
 *     async (req) => { ... },
 *     { quotaSlug: "storage", quantity: (req) => fileSizeFromBody(req), source: "upload" }
 *   ),
 *   { limit: { slug: "max-assets", countFn: ... } }
 * );
 * export const POST = withPermissionCheck(handlePOST, [WORKSPACE_ROLES.ADMIN, WORKSPACE_ROLES.EDITOR]);
 */
export interface QuotaCheckOptions {
  /** Quota slug as defined in the Buildbase dashboard (e.g. "storage", "api-calls"). */
  quotaSlug: string;

  /**
   * Number of units to record after a successful response.
   * Pass a function to compute it from the request (e.g. file size from body).
   * Defaults to 1.
   */
  quantity?: number | ((req: NextRequest) => number | Promise<number>);

  /** Optional source tag recorded with usage (e.g. "upload", "api-v1"). */
  source?: string;

  /**
   * When true, the request is allowed even when quota.available <= 0 (metered overage).
   * When false (default), the request is blocked with 402 when quota is exhausted.
   */
  allowOverage?: boolean;
}

/**
 * Middleware HOF that:
 *   1. Reads the SaaS session from the HttpOnly cookie.
 *   2. Checks the quota status before running the handler.
 *   3. Records usage after a successful (2xx) response (fire-and-forget).
 *
 * workspaceId is read from req.authenticatedUser.workspaceId (set by withPermissionCheck).
 *
 * If SAAS_API_TOKEN_SECRET is not configured the middleware logs a warning and
 * lets the request through — it is fail-open for quota (auth is still enforced).
 */
export function withQuotaCheck<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: QuotaCheckOptions
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  const { quotaSlug, allowOverage = false, source } = options;

  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // workspaceId here is the SDK UUID from the JWT (not the Prisma ObjectId)
    const workspaceId = (request as any).authenticatedUser?.workspaceId as string | undefined;

    if (!workspaceId) {
      // Internal API key bypass or unauthenticated — skip quota
      return handler(request, ...args);
    }

    // Resolve session (stored in HttpOnly cookie, never reaches the browser)
    const { session, setCookieHeader } = await getOrRefreshSessionFromRequest(request);

    if (!session) {
      // SAAS_API_TOKEN_SECRET not configured — warn and let through
      console.warn(
        `[withQuotaCheck] No SaaS session for quota "${quotaSlug}". ` +
          "Set SAAS_API_TOKEN_SECRET to enable quota enforcement."
      );
      return handler(request, ...args);
    }

    // ── Pre-check: is quota available? ──────────────────────────────────────
    const statusResult = await getQuotaStatus({ workspaceId, quotaSlug, sessionId: session.sessionId });

    if (statusResult.success && statusResult.data) {
      const { available, hasOverage } = statusResult.data;

      if (!allowOverage && available <= 0 && !hasOverage) {
        const response = NextResponse.json(
          {
            error: "Quota Exhausted",
            message: `You have used all included ${quotaSlug} for this billing period.`,
            quotaSlug,
            consumed: statusResult.data.consumed,
            included: statusResult.data.included,
            upgradeRequired: true,
          },
          { status: 402 }
        );
        if (setCookieHeader) response.headers.set("Set-Cookie", setCookieHeader);
        return response;
      }
    }

    // ── Run the actual handler ───────────────────────────────────────────────
    const response = await handler(request, ...args);

    // ── Post-success: record usage (fire-and-forget) ─────────────────────────
    if (response.status >= 200 && response.status < 300) {
      const quantity =
        typeof options.quantity === "function" ? await options.quantity(request) : (options.quantity ?? 1);

      recordUsage({
        workspaceId,
        quotaSlug,
        quantity,
        sessionId: session.sessionId,
        source,
      }).catch((err: unknown) => console.error(`[withQuotaCheck] Failed to record usage for "${quotaSlug}":`, err));
    }

    // Propagate refreshed session cookie if the session was renewed
    if (setCookieHeader) response.headers.set("Set-Cookie", setCookieHeader);

    return response;
  };
}
