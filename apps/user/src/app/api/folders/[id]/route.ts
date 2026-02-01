import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";
import { getFolderById, updateFolder, deleteFolder, verifyFolderOwnership } from "@buildbase/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/folders/[id] - Get folder details
 */
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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

    // Verify folder belongs to workspace
    const belongsToWorkspace = await verifyFolderOwnership(id, workspaceId);
    if (!belongsToWorkspace) {
      return NextResponse.json({ success: false, message: "Folder not found" }, { status: 404 });
    }

    // Get folder using service
    const folder = await getFolderById(id);

    if (!folder) {
      return NextResponse.json({ success: false, message: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: folder,
    });
  } catch (error) {
    console.error("Error getting folder:", error);
    return NextResponse.json({ success: false, message: "Failed to get folder" }, { status: 500 });
  }
}

/**
 * PATCH /api/folders/[id] - Update folder
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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
    const { name, description, parentFolderId } = body;

    // Update folder using service
    const folder = await updateFolder(id, {
      name,
      description,
      parentFolderId,
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
    console.error("Error updating folder:", error);
    return NextResponse.json({ success: false, message: "Failed to update folder" }, { status: 500 });
  }
}

/**
 * DELETE /api/folders/[id] - Delete folder
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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
    const { searchParams } = new URL(request.url);
    const recursive = searchParams.get("recursive") === "true";

    // Delete folder using service
    await deleteFolder(id, recursive);

    return NextResponse.json({
      success: true,
      message: "Folder deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json({ success: false, message: "Failed to delete folder" }, { status: 500 });
  }
}
