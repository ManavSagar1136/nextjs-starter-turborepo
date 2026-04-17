import { type NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@buildbase/helpers/auth";
import { getUserWithWorkspaces } from "@buildbase/database/user";

/**
 * GET /api/auth/workspaces
 *
 * Returns all active workspaces the authenticated user belongs to.
 * Used by the browser extension to populate the workspace switcher.
 *
 * Accepts both cookie-based auth and x-extension-token header.
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  const user = (request as any).authenticatedUser as AuthenticatedUser;

  const sdkUserId = user.sdkUserId;
  if (!sdkUserId) {
    return NextResponse.json({ error: "User ID not found in session" }, { status: 400 });
  }

  const result = await getUserWithWorkspaces(sdkUserId);

  if (!result.success || !result.user) {
    return NextResponse.json({ workspaces: [] });
  }

  const workspaces = (result.user.workspaces as any[])
    .filter((m: any) => m.isActive)
    .map((m: any) => ({
      id: m.workspace.sdkWorkspaceId,
      dbId: m.workspace.id,
      name: m.workspace.name,
      image: m.workspace.image ?? null,
      slug: m.workspace.slug ?? null,
      role: m.role,
    }));

  return NextResponse.json({ workspaces });
}

export const GET = withAuth(handleGET);
