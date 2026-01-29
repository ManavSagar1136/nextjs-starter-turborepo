import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";
import { prisma } from "@buildbase/database";
import { buildAssetFilter, type AssetFilterOptions } from "@buildbase/database/assets";

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

    // Pagination
    const page = parseInt(searchParams.get("$page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("$limit") || "20", 10), 100);
    const skip = (page - 1) * limit;

    // Build filters
    const filters: AssetFilterOptions = {};

    // Folder filter
    const folderId = searchParams.get("folderId");
    if (folderId !== null) {
      filters.folderId = folderId === "null" ? null : folderId;
    }

    // Tag filter
    const tagIds = searchParams.get("tagIds");
    if (tagIds) {
      filters.tagIds = tagIds.split(",").filter(Boolean);
    }

    // Search
    const search = searchParams.get("search");
    if (search) {
      filters.search = search;
    }

    // Content type
    const contentType = searchParams.get("contentType");
    if (contentType) {
      filters.contentType = contentType.split(",").filter(Boolean);
    }

    // Public filter
    const isPublic = searchParams.get("isPublic");
    if (isPublic !== null) {
      filters.isPublic = isPublic === "true";
    }

    // Build where clause
    const where = buildAssetFilter(workspaceId, filters);

    // Query assets with pagination
    const [assets, totalDocs] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          folder: {
            select: { id: true, name: true },
          },
          assetTags: {
            include: {
              tag: {
                select: { id: true, name: true, slug: true, color: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ]);

    // Transform response
    const docs = assets.map(asset => ({
      id: asset.id,
      name: asset.filename,
      filename: asset.filename,
      url: asset.url,
      path: asset.path,
      size: asset.size,
      contentType: asset.contentType,
      isPublic: asset.isPublic,
      metadata: asset.metadata,
      folder: asset.folder,
      tags: asset.assetTags.map(at => at.tag),
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
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
    console.error("Error listing assets:", error);
    return NextResponse.json({ success: false, message: "Failed to list assets" }, { status: 500 });
  }
}
