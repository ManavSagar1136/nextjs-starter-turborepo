/**
 * API Key Authentication Middleware
 *
 * Validates an API key from the Authorization header (Bearer rk_live_...)
 * or the x-api-key header and provides the workspace context to the handler.
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
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@buildbase/database";

export interface ApiKeyContext {
  apiKeyId: string;
  apiKeyName: string;
  workspaceId: string;
  scopes: string[];
  rateLimitPerMinute: number;
}

type ApiRouteHandler = (
  req: NextRequest,
  ctx: ApiKeyContext,
  params?: Record<string, string>
) => Promise<NextResponse | Response>;

export function withApiKeyAuth(handler: ApiRouteHandler, requiredScope?: string) {
  return async (req: NextRequest, routeCtx?: { params: Promise<Record<string, string>> | Record<string, string> }) => {
    const authHeader = req.headers.get("authorization");
    const apiKeyHeader = req.headers.get("x-api-key");

    let rawKey: string | null = null;

    if (authHeader?.startsWith("Bearer rk_")) {
      rawKey = authHeader.substring(7);
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

    const result = await verifyApiKey(rawKey);

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

    const ctx: ApiKeyContext = {
      apiKeyId: result.id,
      apiKeyName: result.name,
      workspaceId: result.workspaceId,
      scopes: result.scopes,
      rateLimitPerMinute: result.rateLimitPerMinute,
    };

    const params = routeCtx?.params instanceof Promise ? await routeCtx.params : routeCtx?.params;
    return handler(req, ctx, params);
  };
}
