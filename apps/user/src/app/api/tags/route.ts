import { NextRequest, NextResponse } from "next/server";
import { withPermissionCheck } from "@buildbase/helpers/auth";
import { WORKSPACE_ROLES } from "@buildbase/database/user";
import { listTags, createTag } from "@buildbase/database";

/**
 * GET /api/tags - List tags
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

    const { searchParams } = new URL(request.url);

    // Pagination and filters
    const page = parseInt(searchParams.get("$page") || "1", 10);
    const limit = parseInt(searchParams.get("$limit") || "50", 10);
    const search = searchParams.get("search");

    // List tags using service
    const result = await listTags({
      workspaceId,
      search: search || undefined,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error listing tags:", error);
    const message = error instanceof Error ? error.message : "Failed to list tags";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * POST /api/tags - Create a tag
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = (request as any).authenticatedUser as
      | { workspaceId?: string; userId?: string }
      | undefined;
    if (!authenticatedUser?.workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }
    if (!authenticatedUser?.userId) {
      return NextResponse.json({ success: false, message: "User ID not found" }, { status: 400 });
    }

    const { workspaceId, userId } = authenticatedUser;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Tag name is required" }, { status: 400 });
    }

    // Create tag using service
    const tag = await createTag({
      name,
      color,
      workspaceId,
      userId,
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
    console.error("Error creating tag:", error);
    const message = error instanceof Error ? error.message : "Failed to create tag";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// GET: Allow all workspace members to list tags
export const GET = withPermissionCheck(handleGET, [
  WORKSPACE_ROLES.ADMIN,
  WORKSPACE_ROLES.EDITOR,
  WORKSPACE_ROLES.VIEWER,
]);

// POST: Allow admins and editors to create tags
export const POST = withPermissionCheck(handlePOST, [WORKSPACE_ROLES.ADMIN, WORKSPACE_ROLES.EDITOR]);
