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
import { bb } from "./bb";

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

function buildHeaders(setCookieHeader: string | null): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (setCookieHeader) headers["Set-Cookie"] = setCookieHeader;
  return headers;
}

/**
 * Extract a human-readable message from an SDK error and map it to an HTTP status.
 *
 * Known mappings:
 *   "No active subscription found" → 402  (workspace has no paid plan / trial)
 *   "Unauthorized" / "Forbidden"   → 401/403
 *   anything else                  → 502  (upstream SDK / network failure)
 */
function sdkErrorResponse(err: unknown, fallbackMessage: string, setCookieHeader: string | null): Response {
  const message = err instanceof Error ? err.message : String(err);

  let status = 502;
  if (/no active subscription/i.test(message)) status = 402;
  else if (/unauthorized/i.test(message)) status = 401;
  else if (/forbidden/i.test(message)) status = 403;
  else if (/not found/i.test(message)) status = 404;

  return new Response(JSON.stringify({ success: false, message: status === 502 ? fallbackMessage : message }), {
    status,
    headers: buildHeaders(setCookieHeader),
  });
}

// ─── Record Usage ─────────────────────────────────────────────────────────────

/**
 * POST handler for recording quota usage.
 * Reads session from HttpOnly cookie, workspaceId/quotaSlug/quantity from request body.
 *
 * Expected body: { workspaceId: string, quotaSlug: string, quantity: number }
 * Returns: IRecordUsageResponse
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

    try {
      const result = await bb.withSession(session.sessionId).usage.record(workspaceId, {
        quotaSlug,
        quantity,
        source,
        idempotencyKey,
        metadata,
      });
      return new Response(JSON.stringify({ success: true, ...result }), {
        status: 200,
        headers: buildHeaders(setCookieHeader),
      });
    } catch (err) {
      console.error("[createRecordUsageHandler] Error:", err);
      return sdkErrorResponse(err, "Failed to record usage", setCookieHeader);
    }
  };
}

// ─── Single Quota Status ──────────────────────────────────────────────────────

/**
 * GET handler for fetching a single quota's status.
 * Reads session from HttpOnly cookie, workspaceId/quotaSlug from query params.
 *
 * Expected query: ?workspaceId=...&quotaSlug=...
 * Returns: IQuotaUsageStatusResponse
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

    try {
      const status = await bb.withSession(session.sessionId).usage.getQuota(workspaceId, quotaSlug);
      return new Response(JSON.stringify({ success: true, data: status }), {
        status: 200,
        headers: buildHeaders(setCookieHeader),
      });
    } catch (err) {
      console.error("[createQuotaStatusHandler] Error:", err);
      return sdkErrorResponse(err, "Failed to get quota status", setCookieHeader);
    }
  };
}

// ─── All Quotas ───────────────────────────────────────────────────────────────

/**
 * GET handler for fetching all quota statuses.
 * Reads session from HttpOnly cookie, workspaceId from query params.
 *
 * Expected query: ?workspaceId=...
 * Returns: IAllQuotaUsageResponse
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

    try {
      const result = await bb.withSession(session.sessionId).usage.getAll(workspaceId);
      return new Response(JSON.stringify({ success: true, quotas: result.quotas }), {
        status: 200,
        headers: buildHeaders(setCookieHeader),
      });
    } catch (err) {
      console.error("[createAllQuotasHandler] Error:", err);
      return sdkErrorResponse(err, "Failed to get all quotas", setCookieHeader);
    }
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
 * Expected body: { workspaceId: string, items: IRecordUsageRequest[] }
 * Returns: UsageBatchResponse
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

    try {
      const result = await bb.withSession(session.sessionId).usage.recordBatch(workspaceId, {
        items: items as any,
      });
      // UsageBatchResponse already contains success: boolean — do not duplicate the key
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: buildHeaders(setCookieHeader),
      });
    } catch (err) {
      console.error("[createBatchRecordUsageHandler] Error:", err);
      return sdkErrorResponse(err, "Failed to record batch usage", setCookieHeader);
    }
  };
}

// ─── Usage Logs ───────────────────────────────────────────────────────────────

/**
 * GET handler for fetching paginated usage logs.
 * Reads session from HttpOnly cookie, workspaceId and optional filters from query params.
 *
 * Expected query: ?workspaceId=...&quotaSlug=...&from=...&to=...&source=...&page=...&limit=...
 * Returns: IUsageLogsResponse
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

    try {
      const result = await bb.withSession(session.sessionId).usage.getLogs(workspaceId, {
        quotaSlug,
        from,
        to,
        source,
        page: pageParam ? Number(pageParam) : undefined,
        limit: limitParam ? Number(limitParam) : undefined,
      });
      // SDK IUsageLogsResponse uses `docs` — map to `logs` as expected by useServerUsageLogs
      return new Response(
        JSON.stringify({
          success: true,
          logs: result.docs,
          totalDocs: result.totalDocs,
          totalPages: result.totalPages,
          page: result.page,
          hasNextPage: result.hasNextPage,
        }),
        {
          status: 200,
          headers: buildHeaders(setCookieHeader),
        }
      );
    } catch (err) {
      console.error("[createUsageLogsHandler] Error:", err);
      return sdkErrorResponse(err, "Failed to get usage logs", setCookieHeader);
    }
  };
}
