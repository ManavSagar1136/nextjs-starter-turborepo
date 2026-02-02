import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { listAssets } from "@buildbase/database";

/**
 * GET /api/assets - List assets with filtering and pagination
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = (request as any).authenticatedUser as { workspaceId?: string } | undefined;
    if (!authenticatedUser?.workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { workspaceId } = authenticatedUser;

    const { searchParams } = new URL(request.url);

    // Pagination and filters
    const page = parseInt(searchParams.get("$page") || "1", 10);
    const limit = parseInt(searchParams.get("$limit") || "20", 10);
    const folderId = searchParams.get("folderId");
    const tagIds = searchParams.get("tagIds");
    const search = searchParams.get("search");
    const contentType = searchParams.get("contentType");
    const isPublic = searchParams.get("isPublic");
    const sortBy = searchParams.get("sortBy") as "name" | "size" | "createdAt" | "updatedAt" | "contentType" | null;
    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | null;

    // List assets using service
    const result = await listAssets({
      workspaceId,
      folderId: folderId !== null ? (folderId === "null" ? null : folderId) : undefined,
      tagIds: tagIds ? tagIds.split(",").filter(Boolean) : undefined,
      search: search || undefined,
      contentType: contentType ? contentType.split(",").filter(Boolean) : undefined,
      isPublic: isPublic !== null ? isPublic === "true" : undefined,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing assets:", error);
    return NextResponse.json({ success: false, message: "Failed to list assets" }, { status: 500 });
  }
}

export const GET = withAuth(handleGET, [APP_ROLES.USER]);
