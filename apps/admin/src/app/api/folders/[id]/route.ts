import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getFolderById, updateFolder, deleteFolder } from "@buildbase/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/folders/[id] - Get folder details
 * Admin can access folders from any workspace
 */
async function handleGET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;

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
    const message = error instanceof Error ? error.message : "Failed to get folder";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * PATCH /api/folders/[id] - Update folder
 * Admin can update folders from any workspace
 */
async function handlePATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
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
    const message = error instanceof Error ? error.message : "Failed to update folder";
    const status =
      error instanceof Error && error.message.includes("not found")
        ? 404
        : error instanceof Error && (error.message.includes("Cannot") || error.message.includes("must be"))
          ? 400
          : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

/**
 * DELETE /api/folders/[id] - Delete folder
 * Admin can delete folders from any workspace
 */
async function handleDELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
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
    const message = error instanceof Error ? error.message : "Failed to delete folder";
    const status =
      error instanceof Error && error.message.includes("not found")
        ? 404
        : error instanceof Error && error.message.includes("not empty")
          ? 400
          : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

// Export with auth middleware - Admin only
export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const PATCH = withAuth(handlePATCH, [APP_ROLES.ADMIN]);
export const DELETE = withAuth(handleDELETE, [APP_ROLES.ADMIN]);
