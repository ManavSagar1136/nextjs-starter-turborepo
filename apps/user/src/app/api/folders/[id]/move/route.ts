import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { updateFolder, verifyFolderOwnership } from "@buildbase/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/folders/[id]/move - Move folder to a different parent
 */
async function handlePOST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const authenticatedUser = (request as any).authenticatedUser as { workspaceId?: string } | undefined;
    if (!authenticatedUser?.workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { workspaceId } = authenticatedUser;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { id } = await params;
    const body = await request.json();
    const { targetParentFolderId } = body;

    if (targetParentFolderId === undefined) {
      return NextResponse.json(
        { success: false, message: "targetParentFolderId is required (can be null)" },
        { status: 400 }
      );
    }

    // Verify folder belongs to workspace
    const belongsToWorkspace = await verifyFolderOwnership(id, workspaceId);
    if (!belongsToWorkspace) {
      return NextResponse.json({ success: false, message: "Folder not found" }, { status: 404 });
    }

    // Move folder using service (update parentFolderId)
    const folder = await updateFolder(id, {
      parentFolderId: targetParentFolderId === null ? null : targetParentFolderId,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: folder.id,
        name: folder.name,
        description: folder.description,
        parentFolderId: folder.parentFolderId,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error moving folder:", error);
    const message = error instanceof Error ? error.message : "Failed to move folder";
    const status =
      error instanceof Error && error.message.includes("not found")
        ? 404
        : error instanceof Error &&
            (error.message.includes("Cannot") ||
              error.message.includes("must be") ||
              error.message.includes("Maximum") ||
              error.message.includes("depth"))
          ? 400
          : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

export const POST = withAuth(handlePOST, [APP_ROLES.USER]);
