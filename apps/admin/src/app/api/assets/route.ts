import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { listAssets } from "@buildbase/database";

/**
 * GET /api/assets
 * List all assets with optional filters and pagination
 * Requires: Admin role
 */
async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("$page") || "1", 10);
    const limit = parseInt(searchParams.get("$limit") || "20", 10);

    // Build filters (no workspaceId - admin sees all assets, but can filter by workspaceId)
    const workspaceId = searchParams.get("workspaceId");
    const folderId = searchParams.get("folderId");
    const tagIds = searchParams.get("tagIds");
    const search = searchParams.get("search");
    const contentType = searchParams.get("contentType");
    const isPublic = searchParams.get("isPublic");
    const sortBy = searchParams.get("sortBy") as "name" | "size" | "createdAt" | "updatedAt" | "contentType" | null;
    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | null;

    // List assets using service
    const result = await listAssets({
      workspaceId: workspaceId || undefined, // Optional - if provided, filters by workspace
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
    console.error("[API] Failed to list assets:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch assets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Export with auth middleware - Admin only
export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
