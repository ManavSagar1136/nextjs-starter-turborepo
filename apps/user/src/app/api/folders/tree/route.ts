import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";
import { getFolderTree } from "@buildbase/database";

/**
 * GET /api/folders/tree - Get folder tree structure
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = session.user;
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
