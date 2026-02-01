import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getFolderTree } from "@buildbase/database";

/**
 * GET /api/folders/tree - Get folder tree structure
 * Admin can get folder tree for any workspace (defaults to admin workspace)
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get folder tree using service (no workspaceId - admin sees all folders)
    const tree = await getFolderTree();

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

// Export with auth middleware - Admin only
export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
