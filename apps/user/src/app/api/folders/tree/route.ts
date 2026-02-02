import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getFolderTree } from "@buildbase/database";

/**
 * GET /api/folders/tree - Get folder tree structure
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = (request as any).authenticatedUser as { workspaceId?: string } | undefined;
    if (!authenticatedUser?.workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { workspaceId } = authenticatedUser;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    // Get folder tree using service
    const tree = await getFolderTree(workspaceId);

    return NextResponse.json({
      success: true,
      data: {
        tree,
      },
    });
  } catch (error) {
    console.error("Error getting folder tree:", error);
    const message = error instanceof Error ? error.message : "Failed to get folder tree";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.USER]);
