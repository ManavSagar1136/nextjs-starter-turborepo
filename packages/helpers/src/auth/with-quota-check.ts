/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getOrRefreshSessionFromRequest } from "@buildbase/saas-sdk";
import { bb } from "@buildbase/saas-sdk/server";

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
   * Number of units to record.
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

  /**
   * When to record usage relative to the handler execution.
   *
   * - `'post'` (default): record AFTER a successful 2xx response (fire-and-forget).
   *   Use for discrete counted actions where the resource only exists after success.
   *   Example: API calls, message sends.
   *
   * - `'pre'`: record BEFORE running the handler (optimistic / pre-charge).
   *   If the handler returns a non-2xx response the usage is automatically reverted.
   *   Use for uploads / storage where the resource is created in an external system
   *   (e.g. S3) before the handler runs, so a post-check would be too late.
   *   Example: signed-URL generation — file is uploaded to storage before /complete is called.
   */
  recordTiming?: "pre" | "post";
}

/**
 * Middleware HOF that:
 *   1. Reads the SaaS session from the HttpOnly cookie.
 *   2. Pre-checks quota availability before running the handler (blocks on 402 if exhausted).
 *   3. Records usage according to `recordTiming`:
 *      - 'post' (default): fire-and-forget after a 2xx response. Use for discrete actions.
 *      - 'pre': records before the handler runs; auto-reverts (negative record) if handler
 *               returns non-2xx. Use for uploads where storage is written before the handler completes.
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
  const { quotaSlug, allowOverage = false, source, recordTiming = "post" } = options;

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

    const client = bb.withSession(session.sessionId);

    // ── Pre-check: is quota available? ──────────────────────────────────────
    try {
      const status = await client.usage.getQuota(workspaceId, quotaSlug);

      if (!allowOverage && status.available <= 0 && !status.hasOverage) {
        const response = NextResponse.json(
          {
            error: "Quota Exhausted",
            message: `You have used all included ${quotaSlug} for this billing period.`,
            quotaSlug,
            consumed: status.consumed,
            included: status.included,
            upgradeRequired: true,
          },
          { status: 402 }
        );
        if (setCookieHeader) response.headers.set("Set-Cookie", setCookieHeader);
        return response;
      }
    } catch (err) {
      // Quota API unreachable — fail-open: let the request through rather than
      // blocking a legitimately entitled user due to a transient network issue.
      console.warn(`[withQuotaCheck] Quota pre-check failed for "${quotaSlug}", allowing through:`, err);
    }

    // Resolve quantity once (may read from request body — clone before handler consumes it)
    const quantity = typeof options.quantity === "function" ? await options.quantity(request) : (options.quantity ?? 1);

    // ── PRE timing: record before handler, revert on failure ─────────────────
    if (recordTiming === "pre") {
      await client.usage
        .record(workspaceId, { quotaSlug, quantity, source })
        .catch((err: unknown) => console.error(`[withQuotaCheck] Failed to pre-record usage for "${quotaSlug}":`, err));

      const response = await handler(request, ...args);

      // Revert the pre-charged usage if the handler failed
      if (response.status < 200 || response.status >= 300) {
        client.usage
          .record(workspaceId, {
            quotaSlug,
            quantity: -quantity,
            source: source ? `${source}-revert` : "revert",
          })
          .catch((err: unknown) =>
            console.error(`[withQuotaCheck] Failed to revert pre-charged usage for "${quotaSlug}":`, err)
          );
      }

      if (setCookieHeader) response.headers.set("Set-Cookie", setCookieHeader);
      return response;
    }

    // ── POST timing (default): run handler, record on success ────────────────
    const response = await handler(request, ...args);

    if (response.status >= 200 && response.status < 300) {
      client.usage
        .record(workspaceId, { quotaSlug, quantity, source })
        .catch((err: unknown) =>
          console.error(`[withQuotaCheck] Failed to post-record usage for "${quotaSlug}":`, err)
        );
    }

    if (setCookieHeader) response.headers.set("Set-Cookie", setCookieHeader);
    return response;
  };
}
