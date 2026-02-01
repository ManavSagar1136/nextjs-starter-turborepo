import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { AssetsRepository } from "@buildbase/database/assets";
import { getStorage } from "@buildbase/storage";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/assets/[id]
 * Get asset details
 * Requires: Admin role
 */
async function handleGET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Admin can access any asset without workspace filter
    const asset = await AssetsRepository.findByIdAdmin(id);

    if (!asset) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    // Get full details with relations
    const assetWithDetails = await AssetsRepository.findWithDetails(id);

    return NextResponse.json({
      success: true,
      data: assetWithDetails
        ? {
            id: assetWithDetails.id,
            name: assetWithDetails.filename,
            filename: assetWithDetails.filename,
            url: assetWithDetails.url,
            path: assetWithDetails.path,
            size: assetWithDetails.size,
            contentType: assetWithDetails.contentType,
            isPublic: assetWithDetails.isPublic,
            metadata: assetWithDetails.metadata,
            folder: assetWithDetails.folder,
            tags: assetWithDetails.tags,
            createdAt: assetWithDetails.createdAt.toISOString(),
            updatedAt: assetWithDetails.updatedAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("[API] Failed to get asset:", error);
    return NextResponse.json({ success: false, message: "Failed to get asset" }, { status: 500 });
  }
}

/**
 * DELETE /api/assets/[id]
 * Delete asset
 * Requires: Admin role
 */
async function handleDELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get asset before deletion
    const asset = await AssetsRepository.findByIdAdmin(id);
    if (!asset) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    // Delete from storage
    let deletedFromStorage = false;
    try {
      const storage = await getStorage();
      await storage.delete(asset.path);
      deletedFromStorage = true;
    } catch (storageError) {
      console.error("[API] Error deleting from storage:", storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    await AssetsRepository.delete(id);

    return NextResponse.json({
      success: true,
      message: "Asset deleted successfully",
      data: {
        deletedAssetId: id,
        deletedFromStorage,
      },
    });
  } catch (error) {
    console.error("[API] Failed to delete asset:", error);
    return NextResponse.json({ success: false, message: "Failed to delete asset" }, { status: 500 });
  }
}

// Export with auth middleware - Admin only
export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const DELETE = withAuth(handleDELETE, [APP_ROLES.ADMIN]);
