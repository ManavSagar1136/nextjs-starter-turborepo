import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getTagById, updateTag, deleteTag } from "@buildbase/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tags/[id] - Get tag details
 * Admin can access tags from any workspace
 */
async function handleGET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Get tag using service
    const tag = await getTagById(id);

    if (!tag) {
      return NextResponse.json({ success: false, message: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    console.error("Error getting tag:", error);
    const message = error instanceof Error ? error.message : "Failed to get tag";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * PATCH /api/tags/[id] - Update tag
 * Admin can update tags from any workspace
 */
async function handlePATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, color } = body;

    // Update tag using service
    const tag = await updateTag(id, {
      name,
      color,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
        createdAt: tag.createdAt.toISOString(),
        updatedAt: tag.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating tag:", error);
    const message = error instanceof Error ? error.message : "Failed to update tag";
    const status = error instanceof Error && error.message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

/**
 * DELETE /api/tags/[id] - Delete tag
 * Admin can delete tags from any workspace
 */
async function handleDELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Delete tag using service
    await deleteTag(id);

    return NextResponse.json({
      success: true,
      message: "Tag deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tag:", error);
    const message = error instanceof Error ? error.message : "Failed to delete tag";
    const status = error instanceof Error && error.message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

// Export with auth middleware - Admin only
export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const PATCH = withAuth(handlePATCH, [APP_ROLES.ADMIN]);
export const DELETE = withAuth(handleDELETE, [APP_ROLES.ADMIN]);
