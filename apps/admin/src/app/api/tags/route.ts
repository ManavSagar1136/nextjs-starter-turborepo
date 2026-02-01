import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { listTags, createTag } from "@buildbase/database";

/**
 * GET /api/tags - List tags
 * Admin can list tags across all workspaces or filter by workspaceId
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination and filters
    const page = parseInt(searchParams.get("$page") || "1", 10);
    const limit = parseInt(searchParams.get("$limit") || "50", 10);
    const search = searchParams.get("search");

    // List tags using service (no workspaceId - admin sees all)
    const result = await listTags({
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
 * Admin can create tags in any workspace (defaults to admin workspace)
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = (request as any).authenticatedUser as {
      userId?: string;
      workspaceId?: string;
      role?: string;
    };

    const body = await request.json();
    const { name, color } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Tag name is required" }, { status: 400 });
    }

    // Create tag using service (workspaceId required - will throw error if not provided)
    // For admin, workspaceId should be provided in body if needed, or use a default workspace
    const tag = await createTag({
      name,
      color,
      userId: authenticatedUser.userId!,
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

// Export with auth middleware - Admin only
export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
