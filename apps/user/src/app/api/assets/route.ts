import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";
import { listAssets } from "@buildbase/database";

/**
 * GET /api/assets - List assets with filtering and pagination
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = session.user;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination and filters
    const page = parseInt(searchParams.get("$page") || "1", 10);
    const limit = parseInt(searchParams.get("$limit") || "20", 10);
    const folderId = searchParams.get("folderId");
    const tagIds = searchParams.get("tagIds");
    const search = searchParams.get("search");
    const contentType = searchParams.get("contentType");
    const isPublic = searchParams.get("isPublic");

    // List assets using service
    const result = await listAssets({
      workspaceId,
      folderId: folderId !== null ? (folderId === "null" ? null : folderId) : undefined,
      tagIds: tagIds ? tagIds.split(",").filter(Boolean) : undefined,
      search: search || undefined,
      contentType: contentType ? contentType.split(",").filter(Boolean) : undefined,
      isPublic: isPublic !== null ? isPublic === "true" : undefined,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing assets:", error);
    return NextResponse.json({ success: false, message: "Failed to list assets" }, { status: 500 });
  }
}
