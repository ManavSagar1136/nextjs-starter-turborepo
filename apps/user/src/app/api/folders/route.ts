import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";
import { prisma } from "@buildbase/database";

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

    // Pagination
    const page = parseInt(searchParams.get("$page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("$limit") || "50", 10), 100);
    const skip = (page - 1) * limit;

    // Filters
    const parentFolderId = searchParams.get("parentFolderId");
    const search = searchParams.get("search");

    // Build where clause
    const where: Record<string, unknown> = { workspaceId };

    if (parentFolderId !== null) {
      where.parentFolderId = parentFolderId === "null" ? null : parentFolderId;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Query folders
    const [folders, totalDocs] = await Promise.all([
      prisma.assetFolder.findMany({
        where,
        include: {
          _count: {
            select: {
              assets: true,
              children: true,
            },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.assetFolder.count({ where }),
    ]);

    const docs = folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      description: folder.description,
      parentFolderId: folder.parentFolderId,
      _count: folder._count,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    }));

    const totalPages = Math.ceil(totalDocs / limit);

    return NextResponse.json({
      docs,
      totalDocs,
      limit,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    console.error("Error listing folders:", error);
    return NextResponse.json({ success: false, message: "Failed to list folders" }, { status: 500 });
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

    // Verify parent folder exists if provided
    if (parentFolderId) {
      const parentFolder = await prisma.assetFolder.findFirst({
        where: { id: parentFolderId, workspaceId },
      });
      if (!parentFolder) {
        return NextResponse.json({ success: false, message: "Parent folder not found" }, { status: 404 });
      }
    }

    // Create folder
    const folder = await prisma.assetFolder.create({
      data: {
        name,
        description: description || null,
        parentFolderId: parentFolderId || null,
        workspaceId,
        userId,
      },
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
    return NextResponse.json({ success: false, message: "Failed to create folder" }, { status: 500 });
  }
}
