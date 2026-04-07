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

type AuthedRequest = NextRequest & { authenticatedUser?: { workspaceId?: string } };

async function handleGET(request: NextRequest): Promise<NextResponse> {
  const user = (request as AuthedRequest).authenticatedUser;
  if (!user?.workspaceId) {
    return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
  }

  const keys = await listApiKeys(user.workspaceId);
  return NextResponse.json({ data: keys });
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  const user = (request as AuthedRequest).authenticatedUser;
  if (!user?.workspaceId) {
    return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
  }

  const body = (await request.json()) as {
    name?: string;
    scopes?: string[];
    rateLimitPerMinute?: number;
  };

  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const result = await createApiKey({
    name: body.name,
    workspaceId: user.workspaceId,
    scopes: body.scopes,
    rateLimitPerMinute: body.rateLimitPerMinute,
  });

  return NextResponse.json(
    {
      data: result,
      message: "API key created. Save the key now — it will not be shown again.",
    },
    { status: 201 }
  );
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

  await revokeApiKey(id, user.workspaceId);
  return NextResponse.json({ message: "API key revoked" });
}

export const GET = withPermissionCheck(handleGET, [
  WORKSPACE_ROLES.ADMIN,
  WORKSPACE_ROLES.EDITOR,
  WORKSPACE_ROLES.VIEWER,
]);
export const POST = withPermissionCheck(handlePOST, [WORKSPACE_ROLES.ADMIN]);
export const DELETE = withPermissionCheck(handleDELETE, [WORKSPACE_ROLES.ADMIN]);
