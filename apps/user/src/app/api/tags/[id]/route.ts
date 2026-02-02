import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getTagById, updateTag, deleteTag, verifyTagOwnership } from "@buildbase/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tags/[id] - Get tag details
 */
async function handleGET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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

    // Verify tag belongs to workspace
    const belongsToWorkspace = await verifyTagOwnership(id, workspaceId);
    if (!belongsToWorkspace) {
      return NextResponse.json({ success: false, message: "Tag not found" }, { status: 404 });
    }

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
    return NextResponse.json({ success: false, message: "Failed to get tag" }, { status: 500 });
  }
}

/**
 * PATCH /api/tags/[id] - Update tag
 */
async function handlePATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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

    // Verify tag belongs to workspace
    const belongsToWorkspace = await verifyTagOwnership(id, workspaceId);
    if (!belongsToWorkspace) {
      return NextResponse.json({ success: false, message: "Tag not found" }, { status: 404 });
    }

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
    return NextResponse.json({ success: false, message: "Failed to update tag" }, { status: 500 });
  }
}

/**
 * DELETE /api/tags/[id] - Delete tag
 */
async function handleDELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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

    // Verify tag belongs to workspace
    const belongsToWorkspace = await verifyTagOwnership(id, workspaceId);
    if (!belongsToWorkspace) {
      return NextResponse.json({ success: false, message: "Tag not found" }, { status: 404 });
    }

    // Delete tag using service
    await deleteTag(id);

    return NextResponse.json({
      success: true,
      message: "Tag deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json({ success: false, message: "Failed to delete tag" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.USER]);
export const PATCH = withAuth(handlePATCH, [APP_ROLES.USER]);
export const DELETE = withAuth(handleDELETE, [APP_ROLES.USER]);
