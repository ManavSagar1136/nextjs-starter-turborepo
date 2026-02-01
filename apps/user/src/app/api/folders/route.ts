import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";
import { listFolders, createFolder } from "@buildbase/database";

/**
 * GET /api/folders - List folders with pagination
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
    const limit = parseInt(searchParams.get("$limit") || "50", 10);
    const parentFolderId = searchParams.get("parentFolderId");
    const search = searchParams.get("search");

    // List folders using service
    const result = await listFolders({
      workspaceId,
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
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, userId } = session.user;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, parentFolderId } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Folder name is required" }, { status: 400 });
    }

    // Create folder using service
    const folder = await createFolder({
      name,
      description,
      parentFolderId: parentFolderId || null,
      workspaceId,
      userId,
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
