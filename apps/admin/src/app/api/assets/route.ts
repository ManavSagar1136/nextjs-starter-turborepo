import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { prisma } from "@buildbase/database";
import { buildAssetFilter, type AssetFilterOptions } from "@buildbase/database/assets";

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
    const limit = Math.min(parseInt(searchParams.get("$limit") || "20", 10), 100);
    const skip = (page - 1) * limit;

    // Build filters
    const filters: AssetFilterOptions & { workspaceId?: string } = {};

    // Workspace filter (optional - admin can see all or filter by workspace)
    const workspaceId = searchParams.get("workspaceId");
    if (workspaceId) {
      filters.workspaceId = workspaceId;
    }

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

    // Build where clause - for admin, we can query across all workspaces
    const where = workspaceId ? buildAssetFilter(workspaceId, filters) : {};

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
          user: {
            select: { id: true, name: true, email: true },
          },
          workspace: {
            select: { id: true, name: true },
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
      user: asset.user,
      workspace: asset.workspace,
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
    console.error("[API] Failed to list assets:", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

// Export with auth middleware - Admin only
export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
