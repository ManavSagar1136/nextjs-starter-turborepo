/**
 * API Key Management: /api/v1/api-keys
 *
 * Uses session auth — workspaceId is taken from the authenticated user's session.
 *
 * GET    — List API keys for the current workspace
 * POST   — Create a new API key (ADMIN only)
 * DELETE — Revoke an API key by id query param (ADMIN only)
 */

import { NextRequest, NextResponse } from "next/server";
import { withPermissionCheck } from "@buildbase/helpers/auth";
import { WORKSPACE_ROLES } from "@buildbase/database/user";
import { createApiKey, listApiKeys, revokeApiKey } from "@buildbase/database";

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const NAME_MAX_LENGTH = 100;
const RATE_LIMIT_MIN = 1;
const RATE_LIMIT_MAX = 10_000;

type AuthedRequest = NextRequest & { authenticatedUser?: { workspaceId?: string; userId?: string } };

async function handleGET(request: NextRequest): Promise<NextResponse> {
  const user = (request as AuthedRequest).authenticatedUser;
  if (!user?.workspaceId) {
    return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
  }

  try {
    const keys = await listApiKeys(user.workspaceId);
    return NextResponse.json({ data: keys });
  } catch {
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
  }
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  const user = (request as AuthedRequest).authenticatedUser;
  if (!user?.workspaceId) {
    return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, scopes, rateLimitPerMinute } = body as Record<string, unknown>;

  // Validate name
  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (!trimmedName) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (trimmedName.length > NAME_MAX_LENGTH) {
    return NextResponse.json({ error: `name must be ${NAME_MAX_LENGTH} characters or fewer` }, { status: 400 });
  }

  // Validate scopes (optional — must be string array if provided)
  if (scopes !== undefined) {
    if (!Array.isArray(scopes) || scopes.some(s => typeof s !== "string" || !s.trim())) {
      return NextResponse.json({ error: "scopes must be an array of non-empty strings" }, { status: 400 });
    }
  }

  // Validate rateLimitPerMinute (optional — must be integer in range if provided)
  if (rateLimitPerMinute !== undefined) {
    const rate = Number(rateLimitPerMinute);
    if (!Number.isInteger(rate) || rate < RATE_LIMIT_MIN || rate > RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: `rateLimitPerMinute must be an integer between ${RATE_LIMIT_MIN} and ${RATE_LIMIT_MAX}` },
        { status: 400 }
      );
    }
  }

  try {
    const result = await createApiKey({
      name: trimmedName,
      workspaceId: user.workspaceId,
      createdById: user.userId,
      scopes: Array.isArray(scopes) ? (scopes as string[]) : undefined,
      rateLimitPerMinute: rateLimitPerMinute !== undefined ? Number(rateLimitPerMinute) : undefined,
    });

    return NextResponse.json(
      {
        data: result,
        message: "API key created. Save the key now — it will not be shown again.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  const user = (request as AuthedRequest).authenticatedUser;
  if (!user?.workspaceId) {
    return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing key id" }, { status: 400 });
  }
  if (!OBJECT_ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid key id" }, { status: 400 });
  }

  try {
    const { count } = await revokeApiKey(id, user.workspaceId);
    if (count === 0) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "API key revoked" });
  } catch {
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 });
  }
}

export const GET = withPermissionCheck(handleGET, [
  WORKSPACE_ROLES.ADMIN,
  WORKSPACE_ROLES.EDITOR,
  WORKSPACE_ROLES.VIEWER,
]);
export const POST = withPermissionCheck(handlePOST, [WORKSPACE_ROLES.ADMIN]);
export const DELETE = withPermissionCheck(handleDELETE, [WORKSPACE_ROLES.ADMIN]);
