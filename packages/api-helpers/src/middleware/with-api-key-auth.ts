/**
 * API Key Authentication Middleware
 *
 * Validates an API key from the Authorization header (Bearer rk_live_...)
 * or the x-api-key header, then enforces the per-key rate limit stored in
 * the database (rateLimitPerMinute) via Upstash sliding window.
 *
 * Usage:
 * ```ts
 * export const GET = withApiKeyAuth(async (req, ctx) => {
 *   // ctx.workspaceId, ctx.scopes, etc.
 *   return NextResponse.json({ ok: true });
 * });
 *
 * // With required scope
 * export const POST = withApiKeyAuth(async (req, ctx) => { ... }, "products:write");
 *
 * // With scope + quota tracking (API_CALLS, 1 per request, block on exhausted)
 * export const POST = withApiKeyAuth(
 *   async (req, ctx) => { ... },
 *   "products:write",
 *   { quotaSlug: PLAN_QUOTAS.API_CALLS, quantity: 1, source: "api-v1", allowOverage: false }
 * );
 * ```
 *
 * Quota flow (when quotaOptions is provided):
 *   1. Pre-check quota status — returns 402 if exhausted and allowOverage=false
 *   2. Run handler
 *   3. Post-record usage (fire-and-forget) if handler returns 2xx
 *
 * Session is obtained from the server-side in-memory cache (getServerSession),
 * so no per-request token exchange overhead.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@buildbase/database";
import { defaultRateLimiter } from "@buildbase/cache/factory";
import { getServerSession } from "@buildbase/saas-sdk";
import { bb } from "@buildbase/saas-sdk/server";

export interface ApiKeyContext {
  apiKeyId: string;
  apiKeyName: string;
  workspaceId: string;
  scopes: string[];
  rateLimitPerMinute: number;
}

export interface ApiKeyQuotaOptions {
  /** Quota slug to check and record (e.g. PLAN_QUOTAS.API_CALLS). */
  quotaSlug: string;
  /** Units to record per request. Defaults to 1. */
  quantity?: number;
  /** Source tag recorded with usage (e.g. "api-v1"). */
  source?: string;
  /**
   * When true, the request is allowed even when quota is exhausted (metered overage).
   * When false (default), the request is blocked with 402.
   */
  allowOverage?: boolean;
}

type ApiRouteHandler = (
  req: NextRequest,
  ctx: ApiKeyContext,
  params?: Record<string, string>
) => Promise<NextResponse | Response>;

// rk_live_ prefix (8 chars) + 64 hex chars = 72 total
const RAW_KEY_RE = /^rk_live_[0-9a-f]{64}$/;

export function withApiKeyAuth(handler: ApiRouteHandler, requiredScope?: string, quotaOptions?: ApiKeyQuotaOptions) {
  return async (req: NextRequest, routeCtx?: { params: Promise<Record<string, string>> | Record<string, string> }) => {
    const authHeader = req.headers.get("authorization");
    const apiKeyHeader = req.headers.get("x-api-key");

    let rawKey: string | null = null;

    if (authHeader?.startsWith("Bearer rk_")) {
      rawKey = authHeader.substring(7); // strip "Bearer "
    } else if (apiKeyHeader?.startsWith("rk_")) {
      rawKey = apiKeyHeader;
    }

    if (!rawKey) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Missing API key. Include it as a Bearer token or x-api-key header.",
        },
        { status: 401 }
      );
    }

    // Reject malformed keys before touching the database
    if (!RAW_KEY_RE.test(rawKey)) {
      return NextResponse.json({ error: "Unauthorized", message: "Invalid or revoked API key." }, { status: 401 });
    }

    let result: Awaited<ReturnType<typeof verifyApiKey>>;
    try {
      result = await verifyApiKey(rawKey);
    } catch {
      return NextResponse.json(
        { error: "Internal Server Error", message: "Failed to verify API key." },
        { status: 500 }
      );
    }

    if (!result) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or revoked API key.",
        },
        { status: 401 }
      );
    }

    if (requiredScope && !result.scopes.includes(requiredScope)) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: `API key does not have the required scope: ${requiredScope}`,
        },
        { status: 403 }
      );
    }

    // ── Per-key rate limiting (fail-closed: Redis errors block the request) ──
    let rateLimitResult;
    try {
      rateLimitResult = await defaultRateLimiter.checkRateLimitStrict(`apikey:${result.id}`, {
        windowMs: 60 * 1000,
        maxRequests: result.rateLimitPerMinute,
      });
    } catch {
      return NextResponse.json(
        { error: "Service Unavailable", message: "Rate limiting service unavailable. Try again shortly." },
        { status: 503 }
      );
    }

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: `Rate limit exceeded. Limit: ${rateLimitResult.limit} req/min.`,
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
            "Retry-After": rateLimitResult.retryAfter?.toString() ?? "60",
          },
        }
      );
    }

    const ctx: ApiKeyContext = {
      apiKeyId: result.id,
      apiKeyName: result.name,
      workspaceId: result.workspaceId,
      scopes: result.scopes,
      rateLimitPerMinute: result.rateLimitPerMinute,
    };

    // ── Quota pre-check (if quota tracking is configured) ────────────────────
    if (quotaOptions) {
      const { quotaSlug, allowOverage = false, source } = quotaOptions;
      const session = await getServerSession().catch(() => null);

      if (session) {
        const status = await bb
          .withSession(session.sessionId)
          .usage.getQuota(result.workspaceId, quotaSlug)
          .catch(() => null);

        if (status) {
          const { available, hasOverage } = status;
          if (!allowOverage && available <= 0 && !hasOverage) {
            return NextResponse.json(
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
          }
        }
      }
    }

    const params = routeCtx?.params instanceof Promise ? await routeCtx.params : routeCtx?.params;
    const response = await handler(req, ctx, params);

    // ── Quota post-record (fire-and-forget after 2xx) ────────────────────────
    if (quotaOptions && response.status >= 200 && response.status < 300) {
      const { quotaSlug, quantity = 1, source } = quotaOptions;
      getServerSession()
        .then(session => {
          if (!session) return;
          return bb.withSession(session.sessionId).usage.record(result.workspaceId, { quotaSlug, quantity, source });
        })
        .catch((err: unknown) =>
          console.error(`[withApiKeyAuth] Failed to record quota "${quotaOptions.quotaSlug}":`, err)
        );
    }

    // Add rate limit headers to successful responses
    if (response instanceof NextResponse || response instanceof Response) {
      response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
      response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
      response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());
    }

    return response;
  };
}
