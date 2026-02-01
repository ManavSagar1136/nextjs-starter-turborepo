import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { listFolders, createFolder } from "@buildbase/database";

/**
 * GET /api/folders - List folders with pagination
 * Admin can list folders across all workspaces or filter by workspaceId
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination and filters
    const page = parseInt(searchParams.get("$page") || "1", 10);
    const limit = parseInt(searchParams.get("$limit") || "50", 10);
    const parentFolderId = searchParams.get("parentFolderId");
    const search = searchParams.get("search");

    // List folders using service (no workspaceId - admin sees all)
    const result = await listFolders({
      parentFolderId: parentFolderId !== null ? (parentFolderId === "null" ? null : parentFolderId) : undefined,
      search: search || undefined,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing folders:", error);
    const message = error instanceof Error ? error.message : "Failed to list folders";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * POST /api/folders - Create a folder
 * Admin can create folders in any workspace (defaults to admin workspace)
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = (request as any).authenticatedUser as {
      userId?: string;
      workspaceId?: string;
      role?: string;
    };

    const body = await request.json();
    const { name, description, parentFolderId } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Folder name is required" }, { status: 400 });
    }

    // Create folder using service (workspaceId will be derived from parent if provided, or required)
    const folder = await createFolder({
      name,
      description,
      parentFolderId: parentFolderId || null,
      userId: authenticatedUser.userId!,
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
    console.error("Error creating folder:", error);
    const message = error instanceof Error ? error.message : "Failed to create folder";
    const status = error instanceof Error && error.message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

// Export with auth middleware - Admin only
export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
