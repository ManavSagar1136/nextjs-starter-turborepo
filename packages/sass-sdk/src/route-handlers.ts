/**
 * Route Handler Factories
 *
 * Creates Next.js App Router route handlers (or any Web API-compatible handler)
 * for the buildbase usage/quota APIs. The sessionId is read from the HttpOnly
 * session cookie and NEVER exposed to the client.
 *
 * Register these in your app's API routes:
 *
 * // app/api/saas/usage/record/route.ts
 * import { createRecordUsageHandler } from "@buildbase/saas-sdk/route-handlers";
 * export const POST = createRecordUsageHandler();
 *
 * // app/api/saas/usage/status/route.ts
 * import { createQuotaStatusHandler } from "@buildbase/saas-sdk/route-handlers";
 * export const GET = createQuotaStatusHandler();
 *
 * // app/api/saas/usage/all/route.ts
 * import { createAllQuotasHandler } from "@buildbase/saas-sdk/route-handlers";
 * export const GET = createAllQuotasHandler();
 *
 * Default client-side route paths (used by useUsage hooks):
 *   POST /api/saas/usage/record  — body: { workspaceId, quotaSlug, quantity }
 *   GET  /api/saas/usage/status  — query: ?workspaceId=&quotaSlug=
 *   GET  /api/saas/usage/all     — query: ?workspaceId=
 */
import { getOrRefreshSessionFromRequest } from "./session";
import { recordUsage, getQuotaStatus, getAllQuotas, getUsageLogs, recordBatch } from "./usage";

type RouteHandler = (request: Request) => Promise<Response>;

function json(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

function error(message: string, status = 400, extraHeaders?: Record<string, string>): Response {
  return json({ error: message }, status, extraHeaders);
}

// ─── Record Usage ─────────────────────────────────────────────────────────────

/**
 * POST handler for recording quota usage.
 * Reads session from HttpOnly cookie, workspaceId/quotaSlug/quantity from request body.
 *
 * Expected body: { workspaceId: string, quotaSlug: string, quantity: number }
 * Returns: RecordUsageResponse
 */
export function createRecordUsageHandler(options?: { baseUrl?: string }): RouteHandler {
  return async (request: Request): Promise<Response> => {
    const { session, setCookieHeader } = await getOrRefreshSessionFromRequest(request, options?.baseUrl);

    if (!session) {
      return error("No active session. Ensure SAAS_API_TOKEN_SECRET is configured.", 401);
    }

    let body: {
      workspaceId?: string;
      quotaSlug?: string;
      quantity?: number;
      source?: string;
      idempotencyKey?: string;
      metadata?: Record<string, unknown>;
    };
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON body");
    }

    const { workspaceId, quotaSlug, quantity, source, idempotencyKey, metadata } = body;

    if (!workspaceId || !quotaSlug || typeof quantity !== "number") {
      return error("workspaceId, quotaSlug, and quantity (number) are required");
    }

    const result = await recordUsage({
      workspaceId,
      quotaSlug,
      quantity,
      sessionId: session.sessionId,
      baseUrl: options?.baseUrl,
      source,
      idempotencyKey,
      metadata,
    });

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (setCookieHeader) headers["Set-Cookie"] = setCookieHeader;

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 502,
      headers,
    });
  };
}

// ─── Single Quota Status ──────────────────────────────────────────────────────

/**
 * GET handler for fetching a single quota's status.
 * Reads session from HttpOnly cookie, workspaceId/quotaSlug from query params.
 *
 * Expected query: ?workspaceId=...&quotaSlug=...
 * Returns: QuotaStatusResponse
 */
export function createQuotaStatusHandler(options?: { baseUrl?: string }): RouteHandler {
  return async (request: Request): Promise<Response> => {
    const { session, setCookieHeader } = await getOrRefreshSessionFromRequest(request, options?.baseUrl);

    if (!session) {
      return error("No active session. Ensure SAAS_API_TOKEN_SECRET is configured.", 401);
    }

    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspaceId") ?? "";
    const quotaSlug = url.searchParams.get("quotaSlug") ?? "";

    if (!workspaceId || !quotaSlug) {
      return error("workspaceId and quotaSlug query params are required");
    }

    const result = await getQuotaStatus({
      workspaceId,
      quotaSlug,
      sessionId: session.sessionId,
      baseUrl: options?.baseUrl,
    });

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (setCookieHeader) headers["Set-Cookie"] = setCookieHeader;

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 502,
      headers,
    });
  };
}

// ─── All Quotas ───────────────────────────────────────────────────────────────

/**
 * GET handler for fetching all quota statuses.
 * Reads session from HttpOnly cookie, workspaceId from query params.
 *
 * Expected query: ?workspaceId=...
 * Returns: AllQuotasResponse
 */
export function createAllQuotasHandler(options?: { baseUrl?: string }): RouteHandler {
  return async (request: Request): Promise<Response> => {
    const { session, setCookieHeader } = await getOrRefreshSessionFromRequest(request, options?.baseUrl);

    if (!session) {
      return error("No active session. Ensure SAAS_API_TOKEN_SECRET is configured.", 401);
    }

    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspaceId") ?? "";

    if (!workspaceId) {
      return error("workspaceId query param is required");
    }

    const result = await getAllQuotas({
      workspaceId,
      sessionId: session.sessionId,
      baseUrl: options?.baseUrl,
    });

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (setCookieHeader) headers["Set-Cookie"] = setCookieHeader;

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 502,
      headers,
    });
  };
}

// ─── Batch Record Usage ───────────────────────────────────────────────────────

/**
 * POST handler for recording quota usage in bulk (up to 100 items).
 * Reads session from HttpOnly cookie, workspaceId and items[] from request body.
 *
 * Register at: app/api/saas/usage/batch/route.ts
 *   import { createBatchRecordUsageHandler } from "@buildbase/saas-sdk/route-handlers";
 *   export const POST = createBatchRecordUsageHandler();
 *
 * Expected body: { workspaceId: string, items: BatchRecordItem[] }
 * Returns: BatchRecordUsageResponse
 */
export function createBatchRecordUsageHandler(options?: { baseUrl?: string }): RouteHandler {
  return async (request: Request): Promise<Response> => {
    const { session, setCookieHeader } = await getOrRefreshSessionFromRequest(request, options?.baseUrl);

    if (!session) {
      return error("No active session. Ensure SAAS_API_TOKEN_SECRET is configured.", 401);
    }

    let body: { workspaceId?: string; items?: unknown[] };
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON body");
    }

    const { workspaceId, items } = body;

    if (!workspaceId || !Array.isArray(items) || items.length === 0) {
      return error("workspaceId and items[] are required");
    }
    if (items.length > 100) {
      return error("Maximum 100 items per batch request");
    }

    const result = await recordBatch({
      workspaceId,
      items: items as any,
      sessionId: session.sessionId,
      baseUrl: options?.baseUrl,
    });

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (setCookieHeader) headers["Set-Cookie"] = setCookieHeader;

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 502,
      headers,
    });
  };
}

// ─── Usage Logs ───────────────────────────────────────────────────────────────

/**
 * GET handler for fetching paginated usage logs.
 * Reads session from HttpOnly cookie, workspaceId and optional filters from query params.
 *
 * Expected query: ?workspaceId=...&quotaSlug=...&from=...&to=...&source=...&page=...&limit=...
 * Returns: UsageLogsResponse
 */
export function createUsageLogsHandler(options?: { baseUrl?: string }): RouteHandler {
  return async (request: Request): Promise<Response> => {
    const { session, setCookieHeader } = await getOrRefreshSessionFromRequest(request, options?.baseUrl);

    if (!session) {
      return error("No active session. Ensure SAAS_API_TOKEN_SECRET is configured.", 401);
    }

    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspaceId") ?? "";

    if (!workspaceId) {
      return error("workspaceId query param is required");
    }

    const quotaSlug = url.searchParams.get("quotaSlug") ?? undefined;
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;
    const source = url.searchParams.get("source") ?? undefined;
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    const result = await getUsageLogs({
      workspaceId,
      sessionId: session.sessionId,
      baseUrl: options?.baseUrl,
      quotaSlug,
      from,
      to,
      source,
      page: pageParam ? Number(pageParam) : undefined,
      limit: limitParam ? Number(limitParam) : undefined,
    });

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (setCookieHeader) headers["Set-Cookie"] = setCookieHeader;

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 502,
      headers,
    });
  };
}
