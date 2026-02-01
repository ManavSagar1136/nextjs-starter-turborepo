import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";
import { updateFolder } from "@buildbase/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/folders/[id]/move - Move folder to a different parent
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = session.user;
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
        : error instanceof Error && (error.message.includes("Cannot") || error.message.includes("must be"))
          ? 400
          : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
